const Apify = require('apify');
const cheerio = require('cheerio');

const { log } = Apify;

Apify.main(async () => {
    const input = await Apify.getInput();
    const { searchQuery, asinList = [], maxProducts = 20 } = input;

    const results = [];
    const requestList = [];

    // If ASINs provided, create requests directly
    if (asinList && asinList.length > 0) {
        for (const asin of asinList.slice(0, maxProducts)) {
            requestList.push({
                url: `https://www.amazon.com/dp/${asin}`,
                userData: { asin }
            });
        }
    } else if (searchQuery) {
        // Search Amazon for products
        const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&rh=n%3A172282%2Cp_85%3A2470955011&s=review-rank`;
        requestList.push({
            url: searchUrl,
            userData: { searchQuery }
        });
    } else {
        throw new Error('Either searchQuery or asinList must be provided');
    }

    const requestQueue = await Apify.openRequestQueue();
    for (const req of requestList) {
        await requestQueue.addRequest(req);
    }

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        maxConcurrency: 5,
        maxRequestRetries: 3,

        handlePageFunction: async ({ request, response, body }) => {
            const $ = cheerio.load(body.toString());
            const data = [];

            if (request.userData.asin) {
                // Single product page
                const asin = request.userData.asin;
                const title = $('h1#title span#productTitle').text().trim();
                const price = $('.a-price .a-offscreen').first().text().trim();
                const originalPrice = $('.a-text-price .a-offscreen').first().text().trim();
                const rating = $('.a-icon-alt').first().text().trim();
                const reviews = $('#acrCustomerReviewText').first().text().trim();
                const salesRank = $('#SalesRank').text().trim();
                const category = $('#wayfinding-breadcrumbs_feature_div').text().trim();
                const image = $('#landingImage').attr('src');
                
                const discountMatch = originalPrice.match(/(\d+)/);

                data.push({
                    asin,
                    title,
                    url: request.url,
                    currentPrice: price,
                    originalPrice: originalPrice,
                    discount: discountMatch ? `${Math.round((1 - parseFloat(price.replace(/[$,]/g, '')) / parseFloat(discountMatch[0])) * 100)}%` : null,
                    rating,
                    reviewCount: reviews,
                    salesRank: salesRank.replace(/#[[\d,]/g, '').trim(),
                    category: category.replace(/\s+/g, ' ').trim(),
                    image,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Search results page
                const products = $('div[data-asin]').filter((i, el) => $(el).attr('data-asin') !== '');
                products.slice(0, maxProducts).each((i, el) => {
                    const asin = $(el).attr('data-asin');
                    const title = $(el).find('h2 a span').text().trim();
                    const price = $(el).find('.a-price .a-offscreen').text().trim();
                    const rating = $(el).find('.a-icon-alt').text().trim();
                    const reviews = $(el).find('.a-size-base').text().trim();
                    const url = 'https://www.amazon.com' + $(el).find('h2 a').attr('href');
                    
                    if (asin && title) {
                        data.push({
                            asin,
                            title,
                            url,
                            currentPrice: price || 'N/A',
                            rating: rating || 'N/A',
                            reviewCount: reviews || '0',
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }

            results.push(...data);
            log.info(`Scraped ${data.length} items from ${request.url}`);
        }
    });

    await crawler.run();
    
    // Save results
    await Apify.setOutput('results', results);
    await Apify.setValue('OUTPUT', results);
    
    log.info(`Total items scraped: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));
});
