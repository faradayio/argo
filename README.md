# Argo
A module for rapidly [reverse-geocoding using Mapzen Search](https://mapzen.com/documentation/search/reverse/)

![argo](boat.jpg)

## install
`npm install`

## usage
`node argo.js <input filename> <output filename> <mapzen search key>`

- Expects input columns `latitude` and `longitude`
- Defaults to a limit of 6 requests/second
- Defaults to [openaddresses results only](https://mapzen.com/documentation/search/reverse/#filter-by-data-source)
- Appends [Mapzen response fields](https://search.mapzen.com/v1/reverse?api_key=search-XXXXXXX&point.lat=48.858268&point.lon=2.294471) `housenumber`, `name`, `locality`, `postalcode`, `region_a`, `confidence`, `distance`, and `source` - from the top two results - to the input file schema

