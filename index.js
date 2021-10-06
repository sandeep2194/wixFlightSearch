let apiKey = 'e15168f165msh0518b41af6884f4p1e6897jsnb093b22972f3'
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
let noFlights = false
let currencyCodeSymbolMap = {
    'usd': '$',
    'gbp': 'GBP',
    'inr': 'INR',
}
$w.onReady(function () {
    //console.log('test')
    $w('#repeater1').onItemReady(($item, itemData, index) => itemReadyHandler($item, itemData, index));
    $w('#repeater2').onItemReady(($item, itemData, index) => itemReadyHandler2($item, itemData, index));
    $w('#repeater3').onItemReady(($item, itemData, index) => itemReadyHandler3($item, itemData, index));
    $w('#datePicker1').onChange(() => {
        depart = formatDate($w('#datePicker1'))
        //console.log('dat', depart)
    })
    $w('#datePicker2').onChange(() => {
        returnDate = formatDate($w('#datePicker2'))
    })
    $w('#radioGroup1').onChange(() => {
        const sIndex = $w('#radioGroup1').selectedIndex
        if (sIndex === 0) {
            iternaryType = 'ONE_WAY'
            $w('#datePicker2').hide()
        } if (sIndex === 1) {
            iternaryType = 'ROUND_TRIP'
            $w('#datePicker2').show()
        }
    })
    $w('#pagination1').onChange(e => {
        //console.log('e',$w('#pagination1').currentPage)
        $w('#image25').expand()
        changePageHandler($w('#pagination1').currentPage)
    })
    $w('#input12').onKeyPress((event) => locValidation(event, gofrom, (val) => getAirports(val, items, $w('#repeater1'), $w('#box1'), 'from'), $w('#input12').value))
    $w('#input13').onKeyPress((event) => locValidation(event, goto, (val) => getAirports(val, items, $w('#repeater2'), $w('#box2'), 'to'), $w('#input13').value,))
    $w('#button12').onClick(() => {
        const errBox = $w('#box7')
        const errText = $w('#text39')

        const check = iternaryType === 'ROUND_TRIP' ? selectedFrom && selectedTo && depart && returnDate && adults : selectedFrom && selectedTo && depart && adults
        if (check) {
            $w('#image24').show()
            $w('#repeater3').data = []
            allData = []
            paggedData = []
            startFlightDataSearch()
            errBox.collapse()
        }
        else {
            errText.text = 'one or more fields are empty.'
            errBox.expand()
        }

    })


    $w('#text40').text = adults.toString()
    $w('#vectorImage3').onClick(() => stepAdults('plus'))
    $w('#box8').onClick(() => stepAdults('minus'))
    $w('#dropdown1').onChange(() => {
        tClass = $w('#dropdown1').value
    })
});

function stepAdults(action, ele) {
    const c = $w('#text40')
    if (action === 'plus' && adults < 10) {
        adults = adults + 1
        c.text = adults.toString()
    }
    if (action === 'minus' && adults >= 0) {
        adults = adults - 1
        c.text = adults.toString()
    }
}
function formatDate(ele) {
    const dDate = ele.value
    const year = dDate.getFullYear()
    const mon = dDate.getMonth() + 1
    const day = dDate.getDate()
    return `${year}-${mon}-${day}`
}
function itemReadyHandler($item, itemData, index) {
    $item('#text26').text = itemData.displayName;
    $item('#text26').onClick(() => {
        $w('#input12').value = `${itemData.id} - ${itemData.cityName}`
        selectedFrom = items['from'][index]
        $w('#repeater1').collapse()
        $w('#box1').collapse()
        //console.log('selectedFrom', selectedFrom)
    })

}
function itemReadyHandler2($item, itemData, index) {
    $item('#text27').text = itemData.displayName;
    $item('#text27').onClick(() => {
        $w('#input13').value = `${itemData.id} - ${itemData.cityName}`
        selectedTo = items['to'][index]
        $w('#repeater2').collapse()
        $w('#box2').collapse()
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
            const data2 = await getFlightData(selectedFrom.id, selectedTo.id, depart, tClass, adults)
            const departData2 = fDataProcessing(data2)
            departData2.forEach((s) => {
                flightRepeaterItems.push({ _id: newObjectId(), "depart": s, "returnn": undefined })
            })
        }
        allData = flightRepeaterItems
        totalItems = allData.length
        totalPages = Math.round(totalItems / pageSize)
        $w('#pagination1').currentPage = 1
        $w('#pagination1').totalPages = totalPages === 0 ? 1 : totalPages
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
    if (price) {
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
    } else {
        console.log('json', json)
        noFlights = true
        handleNoFlights()
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
        const response = req.json()
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
    $w('#repeater3').data = []
    //console.log('items: ',flightData)
    if (newPageData.length > 0) {
        //console.log('paggedData', newPageData)
        paggedData = newPageData
        $w('#repeater3').data = newPageData
        //$w('#columnStrip2').show()
        $w('#repeater3').expand()
        $w('#pagination1').expand()
    } else {
        $w('#repeater3').collapse()
        $w('#pagination1').collapse()
        //$w('#columnStrip2').hide()
    }
}
function changePageHandler(currentpage) {
    page = Number(currentpage) - 1
    //console.log('page', page)
    pageHandle(allData)
}
function itemReadyHandler3($item, itemData, index) {
    const { depart, returnn } = itemData
    const { totalFare, ticketAirline, duration } = depart
    let sumRows = []
    let departRows = []
    let returnRows = []

    const departTableRow = tableRowGenrator1(depart, depart.flights.length - 1, duration)
    sumRows.push(departTableRow)
    depart.flights.forEach(element => {
        let it = tableRowGenrator2(element)
        departRows.push(it)
    });
    if (returnn) {
        let r = tableRowGenrator1(returnn, returnn.flights.length - 1, returnn.duration)
        sumRows.push(r)
        returnn.flights.forEach(element => {
            let it = tableRowGenrator2(element)
            returnRows.push(it)
        });
    }

    $w('#table1').rows = sumRows
    $w('#table2').rows = departRows
    if (returnn) {
        $w('#table3').rows = returnRows
        $w('#group8').expand()
    }
    let total = totalFare
    if (returnn) {
        total = total + returnn.totalFare
    }
    $item('#text28').text = `${ticketAirline.name}`
    $item('#text36').text = `${Math.round(total)} ${currencyCodeSymbolMap[currency]}`
    if (index === paggedData.length - 1) {
        $w('#image24').hide()
        $w('#image25').collapse()
    }

    $item('#box5').onClick(() => {
        const el = $item('#box6')
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

function tableRowGenrator1(obj, lastIndex, duration) {
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
function tableRowGenrator2(obj) {
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
function newObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const objectId = timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    }).toLowerCase();
    return objectId;
}
function handleNoFlights() {
    if (noFlights) {
        $w('#text44').expand()
    } else {
        $w('#text44').collapse()
    }
}
