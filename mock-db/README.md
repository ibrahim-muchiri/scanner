# Mock API

If `MOCK_API` is set to `true`, the server will "crawl" the data from the local file system, where some seasons (and its related data) are provided as static JSON files. Of course, this mode only makes sense if the Scanner is used in some development environment, where the developer has no access to the real API or wants to have more control over it.

This comes in handy in combination with the `setBackSeasonToDate` functionality, where the developer can virtually switch to a specific point in time. **The server has a dedicated UI to manipulate the data, just open it in a Browser.** It is also helpful when using a database which does not yet contain any sports data.

In production environments this variable is always set to `false`, so that the real data from our sports data provider can be integrated.

# Available seasons

## Bundesliga

- Todo: Add season 20/21

## EM

- EM 2020: `15733`
  - An anonymised sample of the second beta version (July 2021) exists for this season
  - It included real gambling data from real humans   
- EM 2016: `1243`
- EM 2012: `5143`
- EM 2008: `5142`
- EM 2004: `15732`
- EM 2000: `16985`
- EM 1996: `17072`
