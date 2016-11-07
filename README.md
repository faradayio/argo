# Argo
Rapid [reverse-geocoding using Mapzen Search](https://mapzen.com/documentation/search/reverse/)

![argo](boat.jpg)

### Installation
`npm install argo-geo -g`

### Usage
`argo -i <input filename> -a <mapzen search key> -o <output filename> `

### Arguments
* `-i, --input` (_REQUIRED_) Input filename and path (e.g. '/home/ubuntu/inputfile.csv')
* `-a, --auth` (_REQUIRED_) Mapzen authorization token. [Get one here](https://mapzen.com/developers/).
* `-o, --output` (_OPTIONAL_) Output filename and path if desired. Default is the input filename with 'out_' prepended. 
* `-r, --rate` (_OPTIONAL_) Number of requests per second (default = 6)
* `-n, --latitudefield` (_OPTIONAL_) Name of column containing latitude coordinates (default = 'latitude')
* `-w, --longitudefield` (_OPTIONAL_) Name of column containing longitude coordinates (default = 'longitude')
* `-p, --pois` (_OPTIONAL_) Include POI results from [Who's on first](https://whosonfirst.mapzen.com/) instead of just addresses (default = false)

### Notes
* Expects input columns `latitude` and `longitude` - if this is not the case, use `-n` and `-w` to specify coordinate column names.
* Defaults to [openaddresses and openstreetmap results only](https://mapzen.com/documentation/search/reverse/#filter-by-data-source)
* Defaults to addresses, excluding POIs (schools, parks, etc)
* Appends [Mapzen response fields](https://search.mapzen.com/v1/reverse?api_key=search-XXXXXXX&point.lat=48.858268&point.lon=2.294471) `housenumber`, `name`, `locality`, `postalcode`, `region_a`, `confidence`, `distance`, and `source` - from the top two results - to the input file schema

### License

MIT