let apiKey = 'e15168f165msh0518b41af6884f4p1e6897jsnb093b22972f3'

//event handlers
$w.onReady(function () {
    $w('#fromLocRepeater').onItemReady(($item, itemData, index) => fromRpItemHandler($item, itemData, index));
    $w('#toLocRepeater').onItemReady(($item, itemData, index) => toRpItemHandler($item, itemData, index));
    $w('#tripDataRepeater').onItemReady(($item, itemData, index) => tripDataRpItemHandler($item, itemData, index));
    $w('#departDatePicker').onChange(() => {
        depart = formatDate($w('#departDatePicker'))
    })
    $w('#returnDatePicker').onChange(() => {
        returnDate = formatDate($w('#returnDatePicker'))
    })
    $w('#tripTypeRadioGroup').onChange(tripRadioHandler)
    $w('#flightsDatapagination').onChange(e => {
        $w('#pageChangeLoadingImage').expand()
        changePageHandler($w('#flightsDatapagination').currentPage)
    })
    $w('#fromInput').onKeyPress((event) => locValidation(event, gofrom, (val) => getAirports(val, items, $w('#fromLocRepeater'), $w('#fromReaperterBox'), 'from'), $w('#fromInput').value))
    $w('#toInput').onKeyPress((event) => locValidation(event, goto, (val) => getAirports(val, items, $w('#toLocRepeater'), $w('#toReaperterBox'), 'to'), $w('#toInput').value,))
    $w('#searchButton').onClick(searchButtonHanle)
    $w('#adultsText').text = adults.toString()
    $w('#adultsPlusImage').onClick(() => stepAdults('plus'))
    $w('#adultsminusBox').onClick(() => stepAdults('minus'))
    $w('#classDropdown').onChange(() => {
        tClass = $w('#classDropdown').value
    })
});

//starting search form

let gofrom = ''
let goto = ''
let selectedFrom = undefined
let selectedTo = undefined
let items = {
    'from': [],
    'to': [],
}
let depart = undefined
let returnDate = undefined
let adults = 0
let tClass = 'ECO'
let iternaryType = 'ONE_WAY'
let currencyCodeSymbolMap = {
    'usd': '$',
    'gbp': 'GBP',
    'inr': 'INR',
}

function tripRadioHandler() {
    const sIndex = $w('#tripTypeRadioGroup').selectedIndex
    if (sIndex === 0) {
        iternaryType = 'ONE_WAY'
        $w('#returnDatePicker').hide()
    } if (sIndex === 1) {
        iternaryType = 'ROUND_TRIP'
        $w('#returnDatePicker').show()
    }
}
function searchButtonHanle() {
    const noFBox = $w('#noFlightsBox')
    if (!noFBox.collapsed) {
        noFBox.collapse()
    }
    const errBox = $w('#searchErrorBox')
    const errText = $w('#searchErrorText')
    const check = iternaryType === 'ROUND_TRIP' ? selectedFrom && selectedTo && depart && returnDate && adults : selectedFrom && selectedTo && depart && adults
    if (check) {
        $w('#searchLoadingImage').show()
        $w('#tripDataRepeater').data = []
        allData = []
        paggedData = []
        startFlightDataSearch()
        errBox.collapse()
    }
    else {
        errText.text = 'one or more fields are empty.'
        errBox.expand()
    }
}

function stepAdults(action, ele) {
    const c = $w('#adultsText')
    if (action === 'plus' && adults < 10) {
        adults = adults + 1
        c.text = adults.toString()
    }
    if (action === 'minus' && adults >= 0) {
        adults = adults - 1
        c.text = adults.toString()
    }
}

function fromRpItemHandler($item, itemData, index) {
    $item('#formReapeterTxt').text = itemData.displayName;
    $item('#formReapeterTxt').onClick(() => {
        $w('#fromInput').value = `${itemData.id} - ${itemData.cityName}`
        selectedFrom = items['from'][index]
        $w('#fromLocRepeater').collapse()
        $w('#fromReaperterBox').collapse()
        //console.log('selectedFrom', selectedFrom)
    })

}
function toRpItemHandler($item, itemData, index) {
    $item('#toReapeterTxt').text = itemData.displayName;
    $item('#toReapeterTxt').onClick(() => {
        $w('#toInput').value = `${itemData.id} - ${itemData.cityName}`
        selectedTo = items['to'][index]
        $w('#toLocRepeater').collapse()
        $w('#toReaperterBox').collapse()
        //	console.log('selectedTo', selectedTo)
    })
}

async function getAirports(val, state, rp, box, key) {
    let url = "https://priceline-com-provider.p.rapidapi.com/v1/flights/locations?name=";
    let fullUrl = url + val
    //console.log('fullUrl', fullUrl)
    fetch(fullUrl, {
        method: 'get', headers: {
            'x-rapidapi-host': 'priceline-com-provider.p.rapidapi.com',
            'x-rapidapi-key': apiKey
        }
    })
        .then(response => response.json())
        .then(json => {
            //console.log('json', json)
            try {
                state[key] = [...json.map((j, i) => ({ ...j, "_id": i + j.id }))]
                //console.log('fromitems',state[key].slice(0,3))
                if (state[key].length > 0) {
                    rp.data = state[key].slice(0, 3)
                    rp.expand()
                    box.expand()
                }
                else {
                    rp.collapse()
                    box.collapse()
                }
            } catch (e) {
                console.log('json', json);
                console.error(e)
            }
        }).catch(e => console.error(e));
}

function locValidation(event, state, cb, val) {
    //console.log('v',val)
    const pressLength = event.key.length
    let check = false
    let tVal = event.key !== 'Enter' ? val + event.key : val
    if (pressLength === 1 || event.key === 'Enter') {
        tVal.split('').forEach((c) => { check = (/[a-zA-Z]/).test(c) })
    }
    //console.log('ch',check)
    if (check) {
        state = tVal
    }
    if (event.key === 'Backspace') {
        let str = val.split('')
        //console.log('str',str)
        str.pop()
        state = str.join('')
    }

    //console.log('del', event.key)
    let keyCountCheck = tVal.length == 3 || tVal.length == 6 ? true : false
    //console.log('k',keyCountCheck)
    if (event.key === 'Enter') {
        keyCountCheck = true
    }
    if (keyCountCheck && check) {
        //console.log('key',event.key)
        cb(state)
    }
}

// ending search form





//start flights data

let allData = []
let paggedData = []
let totalItems = 0
let totalPages = 0
let pageSize = 10
let page = 0

let currency = 'usd'

async function startFlightDataSearch() {
    try {
        let flightRepeaterItems = []
        if (iternaryType === 'ROUND_TRIP') {
            const data = await Promise.all([getFlightData(selectedFrom.id, selectedTo.id, depart, tClass, adults), getFlightData(selectedTo.id, selectedFrom.id, returnDate, tClass, adults)])
            if (data[0].pricedItinerary) {
                const departData = fDataProcessing(data[0])
                const returnData = fDataProcessing(data[1])
                for (let i = 0; i < returnData.length; i++) {
                    const element = returnData[i];
                    for (let i2 = 0; i2 < departData.length; i2++) {
                        const element2 = departData[i2];
                        flightRepeaterItems.push({ _id: newObjectId(), "depart": element2, "returnn": element, })
                    }
                }
            } else {
                handleNoFlights()
                throw 'error no flights'
            }

        } else {

            const data2 = await getFlightData(selectedFrom.id, selectedTo.id, depart, tClass, adults)
            if (data2.pricedItinerary) {
                const departData2 = fDataProcessing(data2)
                departData2.forEach((s) => {
                    flightRepeaterItems.push({ _id: newObjectId(), "depart": s, "returnn": undefined })
                })
            } else {
                handleNoFlights()
                throw 'error no flights'
            }
        }
        allData = flightRepeaterItems
        totalItems = allData.length
        totalPages = Math.round(totalItems / pageSize)
        $w('#flightsDatapagination').currentPage = 1
        $w('#flightsDatapagination').totalPages = totalPages === 0 ? 1 : totalPages
        pageHandle(flightRepeaterItems)

    } catch (error) {
        console.error(error)
    }
}

function fDataProcessing(json) {
    let items = []
    const price = json.pricedItinerary
    const slice = json.slice
    const segment = json.segment
    const airline = json.airline
    const airport = json.airport
    for (let index = 0; index < price.length; index++) {
        const element = price[index];
        let t = { _id: newObjectId() }
        t.duration = element.totalTripDurationInHours
        t.totalFare = element.pricingInfo.totalFare
        const tAirline = airline.find(a => a.code === element.pricingInfo.ticketingAirline)
        t.ticketAirline = { code: tAirline.code, name: tAirline.name }
        const sliceId = element.slice[0].uniqueSliceId
        const tSilce = slice.find(s => s.uniqueSliceId === sliceId)
        t.sliceDuration = tSilce.duration
        let segIds = tSilce.segment.map(s => s.uniqueSegId)
        let seg = segment.filter(s => segIds.includes(s.uniqueSegId))
        let flights = seg.map(f => {
            const d1 = new Date(f.arrivalDateTime)
            const d2 = new Date(f.departDateTime)
            const oAirportObj = airport.find(o => o.code === f.origAirport)
            const dAirportObj = airport.find(o => o.code === f.destAirport)
            let fl = {
                arrivalTime: `${d1.getHours().toString().padStart(2, '0')}:${d1.getMinutes().toString().padStart(2, "0")}`,
                arrivalDate: `${d1.toDateString().substring(3)}`,
                departureTime: `${d2.getHours().toString().padStart(2, '0')}:${d2.getMinutes().toString().padStart(2, "0")}`,
                departureDate: `${d2.toDateString().substring(3)}`,
                origAirport: { code: f.origAirport, name: oAirportObj.name },
                destAirport: { code: f.destAirport, name: dAirportObj.name },
                flightNumber: f.flightNumber,
                stopQuantity: f.stopQuantity,
                aTimestamp: d1.getTime(),
                dTimestamp: d2.getTime()
            }
            return fl
        })
        t.flights = flights.sort((a, b) => a.dTimestamp - b.dTimestamp)
        items.push(t)
    }
    return items
}

async function getFlightData(from, to, depart, tClass, adults) {
    try {
        let url = "https://priceline-com-provider.p.rapidapi.com/v1/flights/search?";
        let fullUrl = url + `sort_order=PRICE&location_departure=${from}&date_departure=${depart}&class_type=${tClass}&location_arrival=${to}&itinerary_type=ONE_WAY&number_of_passengers=${adults}`
        //console.log('fullUrl', fullUrl)
        const req = await fetch(fullUrl, {
            method: 'get', headers: {
                'x-rapidapi-host': 'priceline-com-provider.p.rapidapi.com',
                'x-rapidapi-key': apiKey
            }
        })
        const response = await req.json()
        return response
    } catch (e) {
        console.error(e)
    }
}
function pageHandle(data) {
    let newPageData = []
    for (let index = page * pageSize; index < pageSize * page + pageSize; index++) {
        const element = data[index];
        if (index === data.length) {
            break
        }
        newPageData.push(element)
    }
    //console.log('tpD', thisPageData)
    $w('#tripDataRepeater').data = []
    //console.log('items: ',flightData)
    if (newPageData.length > 0) {
        //console.log('paggedData', newPageData)
        paggedData = newPageData
        $w('#tripDataRepeater').data = newPageData
        //$w('#columnStrip2').show()
        $w('#tripDataRepeater').expand()
        $w('#flightsDatapagination').expand()
    } else {
        $w('#tripDataRepeater').collapse()
        $w('#flightsDatapagination').collapse()
        //$w('#columnStrip2').hide()
    }
}
function changePageHandler(currentpage) {
    page = Number(currentpage) - 1
    //console.log('page', page)
    pageHandle(allData)
}
function tripDataRpItemHandler($item, itemData, index) {
    const { depart, returnn } = itemData
    const { totalFare, ticketAirline, duration } = depart
    let sumRows = []
    let departRows = []
    let returnRows = []

    const departTableRow = summaryTableRowGenrator(depart, depart.flights.length - 1, duration)
    sumRows.push(departTableRow)
    depart.flights.forEach(element => {
        let it = flightDetailsTableRowGenrator(element)
        departRows.push(it)
    });
    if (returnn) {
        let r = summaryTableRowGenrator(returnn, returnn.flights.length - 1, returnn.duration)
        sumRows.push(r)
        returnn.flights.forEach(element => {
            let it = flightDetailsTableRowGenrator(element)
            returnRows.push(it)
        });
    }

    $w('#tripSummaryTable').rows = sumRows
    $w('#departFlightDetailsTable').rows = departRows
    if (returnn) {
        $w('#returnFlightDetailsTable').rows = returnRows
        $w('#returnFlightDetailsUIgroup').expand()
    }
    let total = totalFare
    if (returnn) {
        total = total + returnn.totalFare
    }
    $item('#airlineNameTxt').text = `${ticketAirline.name}`
    $item('#totalPriceTxt').text = `${Math.round(total)} ${currencyCodeSymbolMap[currency]}`
    if (index === paggedData.length - 1) {
        $w('#searchLoadingImage').hide()
        $w('#pageChangeLoadingImage').collapse()
    }

    $item('#openFLighsDetails').onClick(() => {
        const el = $item('#completeFlightDetailsBox')
        const i1 = $item('#vectorImage1')
        const i2 = $item('#vectorImage2')
        const c = el.collapsed
        if (c) {
            el.expand()
            i1.collapse()
            i2.expand()
        } else {
            el.collapse()
            i1.expand()
            i2.collapse()
        }
    })
}

function summaryTableRowGenrator(obj, lastIndex, duration) {
    const d = duration + 'h'
    let r = {
        "dtime": obj.flights[0].departureTime,
        "oriairport": obj.flights[0].origAirport.code,
        "ddate": obj.flights[0].departureDate,
        "stops": obj.flights.length > 1 && d ? `${Math.ceil(obj.flights.length / 2)} Stops | ${d}` : 'Non Stop ' + d,
        "atime": obj.flights[lastIndex].arrivalTime,
        "dairport": obj.flights[lastIndex].destAirport.code,
        "adate": obj.flights[lastIndex].arrivalDate
    }
    return r
}
function flightDetailsTableRowGenrator(obj) {
    let arrDate = new Date(obj.aTimestamp)
    let depDate = new Date(obj.dTimestamp)
    let t = arrDate.getTime() - depDate.getTime()
    let d = Math.round(t / (1000 * 3600));
    let r = {
        "dtime": obj.departureTime,
        "oriairport": obj.origAirport.name,
        "ddate": obj.departureDate,
        "stops": obj.stopQuantity === 0 && d ? "Non-stop | " + d + 'h' : obj.stops + 'Stops | ' + d + 'h',
        "atime": obj.arrivalTime,
        "dairport": obj.destAirport.name,
        "adate": obj.arrivalDate
    }
    return r
}
//end flights data

//helpers
function formatDate(ele) {
    const dDate = ele.value
    const year = dDate.getFullYear()
    const mon = dDate.getMonth() + 1
    const day = dDate.getDate()
    return `${year}-${mon}-${day}`
}
function newObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const objectId = timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    }).toLowerCase();
    return objectId;
}
function handleNoFlights() {
    $w('#searchLoadingImage').hide()
    $w('#tripDataRepeater').collapse()
    $w('#flightsDatapagination').collapse()
    $w('#noFlightsBox').expand()
}
