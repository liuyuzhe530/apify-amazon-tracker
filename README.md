# Amazon Price Tracker

Scrape Amazon product prices, ratings, rankings and track price history.

## Features
- Search Amazon products by keyword
- Track specific products by ASIN
- Get current price, original price, discount percentage
- Extract product ratings and review counts
- Get sales rank and category information

## Input Parameters
- `searchQuery`: Search keyword for Amazon products
- `asinList`: Array of ASINs to track (optional)
- `maxProducts`: Maximum products to scrape (default: 20)

## Output
JSON array with product data including:
- ASIN, Title, URL
- Current Price, Original Price, Discount
- Rating, Review Count
- Sales Rank, Category
- Timestamp

## Usage
```json
{
  "searchQuery": "wireless headphones",
  "maxProducts": 10
}
```

## Pricing
$0.05 per run

## API Endpoint
https://api.apify.com/v2/acts/YOUR_USERNAME~amazon-price-tracker/runs
