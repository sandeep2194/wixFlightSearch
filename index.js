const apiKey = '96aa21bcd7mshde145a24bf62bdep14a2a1jsnb90adc47aabe'
//event handlers
$w.onReady(function () {
    $w('#routeUiRepeat').onItemReady(routerUiRepeatHandler)
    $w('#tripDataRepeater').onItemReady(tripDataRpItemHandler);
    editARowToUiRepeater('add')
    $w('#addARouteRowBtn').onClick(() => editARowToUiRepeater('add'))
    $w('#removeARouteRowBtn').onClick(() => editARowToUiRepeater('remove'))

    $w('#tripTypeRadioGroup').onChange(tripRadioHandler)
    $w('#flightsDatapagination').onChange(e => {
        $w('#pageChangeLoadingImage').expand()
        changePageHandler($w('#flightsDatapagination').currentPage)
    })
    const returnDatePicker = $w('#returnDatePicker')
    returnDatePicker.onChange(() => {
        returnDate = formatDate(returnDatePicker)
    })
    $w('#searchButton').onClick(searchButtonHanle)
    const adultText = $w('#adultsText')
    adultText.text = passengers.adults.toString()
    $w('#adultsPlusImage').onClick(() => passengerCountHandler('plus', adultText, 'adults'))
    $w('#adultsminusBox').onClick(() => passengerCountHandler('minus', adultText, 'adults'))
    const childrenTxt = $w('#childrenTxt')
    childrenTxt.text = passengers.children.toString()
    $w('#childrenPlus').onClick(() => passengerCountHandler('plus', childrenTxt, 'children'))
    $w('#childrenMinus').onClick(() => passengerCountHandler('minus', childrenTxt, 'children'))
    const infantTxt = $w('#infantTxt')
    infantTxt.text = passengers.infantOnSeat.toString()
    $w('#infantPlus').onClick(() => passengerCountHandler('plus', infantTxt, 'infantOnSeat'))
    $w('#infantMinus').onClick(() => passengerCountHandler('minus', infantTxt, 'infantOnSeat'))
    const infantLapTxt = $w('#infantLapTxt')
    infantLapTxt.text = passengers.infantOnLap.toString()
    $w('#infantLapPlusBtn').onClick(() => passengerCountHandler('plus', infantLapTxt, 'infantOnLap'))
    $w('#infantLapMinusBtn').onClick(() => passengerCountHandler('minus', infantLapTxt, 'infantOnLap'))
    $w('#classDropdown').onChange(() => {
        tClass = $w('#classDropdown').value
    })
});

//starting search form

let routes = []
let returnDate = undefined
let passengers = {
    adults: 0,
    children: 0,
    infantOnLap: 0,
    infantOnSeat: 0,
}
let tClass = 'ECO'
let iternaryType = 'ONE_WAY'
let currencyCodeSymbolMap = {
    'usd': '$',
    'gbp': 'GBP',
    'inr': 'INR',
}
function routerUiRepeatHandler($item, itemData, index) {
    index === 0 && $item('#extra').expand()
    $item('#fromInput').onKeyPress((event) => locValidation(event, routes[index].from, (val) => getAirports(val, routes[index].items, $item('#tableFromLoc'), 0), $item('#fromInput').value))
    $item('#tableFromLoc').onRowSelect((e) => {
        const f = routes[index].items[0].find((o) => o.displayName === e.rowData.airportName)
        routes[index].selected[0] = f
        $item('#fromInput').value = `${f.id} - ${f.cityName}`
        $item('#tableFromLoc').collapse()
    })
    $item('#toInput').onKeyPress((event) => locValidation(event, routes[index].to, (val) => getAirports(val, routes[index].items, $item('#tableToLoc'), 1), $item('#toInput').value))
    $item('#tableToLoc').onRowSelect((e) => {
        const f = routes[index].items[1].find((o) => o.displayName === e.rowData.airportName)
        routes[index].selected[1] = f
        $item('#toInput').value = `${f.id} - ${f.cityName}`
        $item('#tableToLoc').collapse()
    })
    const datePickerDepart = $item('#departDatePicker')
    const pickerHelper = $item('#datePickerHelper')
    datePickerDepart.onClick(() => {
        pickerHelper.expand()
    })
    datePickerDepart.onViewportLeave(() => {
        pickerHelper.collapse()
    })
    datePickerDepart.onBlur(() => {
        pickerHelper.collapse()
    })
    datePickerDepart.onChange(() => {
        routes[index].date = formatDate(datePickerDepart)
        pickerHelper.collapse()
    })
}
function editARowToUiRepeater(action, type = 'oneWay') {
    const r = $w('#routeUiRepeat')
    if (action === 'add' && routes.length < 3) {
        routes.push({ _id: newObjectId(), from: '', to: '', date: '', items: [], selected: [], date2: '' })
        r.data = routes
    }
    if (action === 'remove' && routes.length > 1) {
        routes.pop()
        r.data = routes
    }
    if (action === 'removeAll' && routes.length > 1) {
        for (let i = 1; i <= routes.length; i++) {
            routes.pop()
        }
        r.data = routes
    }
}
function tripRadioHandler() {
    const sIndex = $w('#tripTypeRadioGroup').selectedIndex
    if (sIndex === 0) {
        $w('#returnDatePicker').collapse()
        editARowToUiRepeater('removeAll')
        $w('#addARouteRowBtn').collapse()
        $w('#removeARouteRowBtn').collapse()
    } if (sIndex === 1) {
        $w('#returnDatePicker').expand()
        editARowToUiRepeater('removeAll')
        $w('#addARouteRowBtn').collapse()
        $w('#removeARouteRowBtn').collapse()
    }
    if (sIndex === 2) {
        iternaryType = 'MULTI_CITY'
        editARowToUiRepeater('add')
        $w('#addARouteRowBtn').expand()
        $w('#removeARouteRowBtn').expand()
        $w('#returnDatePicker').value = undefined
        $w('#returnDatePicker').collapse()
    }
}
function searchButtonHanle() {
    const noFBox = $w('#noFlightsBox')
    if (!noFBox.collapsed) {
        noFBox.collapse()
    }
    const errBox = $w('#searchErrorBox')
    const errText = $w('#searchErrorText')
    let check = false
    routes.forEach((r) => {
        if (r.selected.length === 2 && r.date) {
            check = true
        } else {
            check = false
        }
    })
    if (check) {
        $w('#searchLoadingImage').expand()
        $w('#tripDataRepeater').data = []
        allData = []
        paggedData = []
        page = 0
        startFlightDataSearch()
        errBox.collapse()
    }
    else {
        errText.text = 'one or more fields are empty.'
        errBox.expand()
        $w('#searchLoadingImage').collapse()
    }
}

function passengerCountHandler(action, el, state) {

    if (action === 'plus' && passengers[state] < 10) {
        passengers[state] = passengers[state] + 1
        el.text = passengers[state].toString()
    }
    if (action === 'minus' && passengers[state] > 0) {
        passengers[state] = passengers[state] - 1
        el.text = passengers[state].toString()
    }
}

async function getAirports(val, state, table, key) {
    let url = "https://priceline-com-provider.p.rapidapi.com/v1/flights/locations?name=";
    let fullUrl = url + val
    fetch(fullUrl, {
        method: 'get', headers: {
            'x-rapidapi-host': 'priceline-com-provider.p.rapidapi.com',
            'x-rapidapi-key': apiKey
        }
    })
        .then(response => response.json())
        .then(json => {
            try {
                state[key] = [...json.map((j, i) => ({ ...j, "_id": i + j.id }))]
                if (state[key].length > 0) {
                    table.rows = state[key].slice(0, 3).map(a => ({ airportName: a.displayName }))
                    table.expand()
                }
                else {
                    table.collapse()
                }
            } catch (e) {
                console.log('json', json);
                console.error(e)
            }
        }).catch(e => console.error(e));
}

function locValidation(event, state, cb, val) {
    const pressLength = event.key.length
    let check = false
    let tVal = event.key !== 'Enter' ? val + event.key : val
    if (pressLength === 1 || event.key === 'Enter') {
        tVal.split('').forEach((c) => { check = (/[a-zA-Z]/).test(c) })
    }
    if (check) {
        state = tVal
    }
    if (event.key === 'Backspace') {
        let str = val.split('')
        str.pop()
        state = str.join('')
    }

    let keyCountCheck = tVal.length == 3 || tVal.length == 6 ? true : false
    if (event.key === 'Enter') {
        keyCountCheck = true
    }
    if (keyCountCheck && check) {
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
        const { adults, children, infantOnSeat } = passengers
        const totalPassengers = adults + children + infantOnSeat
        let processedData = []
        let promiseArr = []
        routes.forEach(r => {
            if (!returnDate) {
                promiseArr.push(getFlightData(r.selected[0].id, r.selected[1].id, r.date, tClass, totalPassengers))
            }
        })
        if (returnDate) {
            promiseArr.push(getFlightData(routes[0].selected[0].id, routes[0].selected[1].id, routes[0].date, tClass, totalPassengers))
            promiseArr.push(getFlightData(routes[0].selected[1].id, routes[0].selected[0].id, returnDate, tClass, totalPassengers))
        }
        let dataFromAPi = await Promise.all(promiseArr)

        const nullCheck = dataFromAPi.map(r => r && r.pricedItinerary ? true : false)
        if (!nullCheck.includes(false)) {
            dataFromAPi.forEach(r => {
                const pD = fDataProcessing(r)
                processedData.push(pD)
            })
        } else {
            handleNoFlights()
            throw 'error no flights'
        }
        const initialArr = processedData[0].map(r => ({ _id: newObjectId(), ["r" + String(processedData.length - 1)]: r }))
        processedData.reverse()
        combineRoutes(processedData, initialArr, processedData.length - 2)
        totalItems = allData.length
        totalPages = Math.round(totalItems / pageSize)
        if (page === 0) {
            $w('#flightsDatapagination').currentPage = 1
            $w('#flightsDatapagination').totalPages = totalPages === 0 ? 1 : totalPages
        }
        pageHandle(allData)

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
        const allItemsSliceId = items.map((s) => s.sliceId)
        const sliceId = element.slice[0].uniqueSliceId
        if (!allItemsSliceId.includes(sliceId)) {
            let t = { _id: newObjectId() }
            t.duration = element.totalTripDurationInHours
            t.totalFare = element.pricingInfo.totalFare
            const tAirline = airline.find(a => a.code === element.pricingInfo.ticketingAirline)
            t.ticketAirline = { code: tAirline.code, name: tAirline.name }
            t.sliceId = sliceId
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
    }
    return items
}

async function getFlightData(from, to, depart, tClass, adults) {
    try {
        let url = "https://priceline-com-provider.p.rapidapi.com/v1/flights/search?";
        let fullUrl = url + `sort_order=PRICE&location_departure=${from}&date_departure=${depart}&class_type=${tClass}&location_arrival=${to}&itinerary_type=ONE_WAY&number_of_passengers=${adults}`
        console.log('url: ', fullUrl);
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
    $w('#tripDataRepeater').data = []
    if (newPageData.length > 0) {
        paggedData = newPageData
        $w('#tripDataRepeater').data = newPageData
        $w('#wholeFlightsUI').expand()

    } else {
        $w('#wholeFlightsUI').collapse()
    }
}
function changePageHandler(currentpage) {
    page = Number(currentpage) - 1
    pageHandle(allData)
}
function tripDataRpItemHandler($item, itemData, index) {
    const data = Object.values(itemData)
    const { totalFare, ticketAirline, duration } = data[1]
    let sumRows = []
    let departRows = []
    let returnRows = []
    let return2Rows = []
    const departTableRow = summaryTableRowGenrator(data[1], data[1].flights.length - 1, duration)
    sumRows.push(departTableRow)
    data[1].flights.forEach(element => {
        let it = flightDetailsTableRowGenrator(element)
        departRows.push(it)
    });
    if (data[2]) {
        let r = summaryTableRowGenrator(data[2], data[2].flights.length - 1, data[2].duration)
        sumRows.push(r)
        data[2].flights.forEach(element => {
            let it = flightDetailsTableRowGenrator(element)
            returnRows.push(it)
        });
    }
    if (data[3]) {
        let r = summaryTableRowGenrator(data[3], data[3].flights.length - 1, data[3].duration)
        sumRows.push(r)
        data[3].flights.forEach(element => {
            let it = flightDetailsTableRowGenrator(element)
            return2Rows.push(it)
        });
    }
    $item('#tripSummaryTable').rows = sumRows
    $item('#departFlightDetailsTable').rows = departRows
    if (data[2]) {
        $item('#returnFlightDetailsTable').rows = returnRows
        $item('#returnFlightDetailsUIgroup').expand()
    }
    if (data[3]) {
        $item('#returnFlightDetailsTable2').rows = return2Rows
        $item('#returnFlightDetailsUIgroup2').expand()
    }
    let total = totalFare
    if (data[2]) {
        total = total + data[2].totalFare
    }
    if (data[3]) {
        total = total + data[3].totalFare
    }
    $item('#airlineNameTxt').text = `${ticketAirline.name}`
    $item('#totalPriceTxt').text = `${Math.ceil(total)} ${currencyCodeSymbolMap[currency]}`
    if (index === paggedData.length - 1) {
        $w('#searchLoadingImage').collapse()
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
        "stops": obj.flights.length > 1 && d ? `${Math.ceil(obj.flights.length / 2)} Stop(s) | ${d}` : 'Non Stop ' + d,
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
        "stops": obj.stopQuantity === 0 && d ? `Non-stop | ${d}h | Flight No. ${obj.flightNumber}` : `${obj.stops} Stop(s) | ${d}h | Flight No. ${obj.flightNumber}`,
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
    $w('#searchLoadingImage').collapse()
    $w('#wholeFlightsUI').collapse()
    $w('#noFlightsBox').expand()
}

const combineRoutes = (inputArr, resultArr, index) => {
    let arr = inputArr[index]
    let newRArr = []
    let check = index < 0
    if (!check) {
        for (let i = 0; i < arr.length; i++) {
            const element = arr[i];
            for (let i2 = 0; i2 < resultArr.length; i2++) {
                const element2 = resultArr[i2];
                newRArr.push({ ...element2, ["r" + index]: element })
            }
        }
        combineRoutes(inputArr, newRArr, index - 1)
    } else {
        allData = resultArr
    }
}

