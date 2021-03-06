$.ajaxSetup({cache: false});

$(function() {
    $(document).ready($("#collapseUpdateBooking")
        .append(`<div id="searchResult" hidden>
                    <div style="color: black">Room is available:</div>
                </div>`));
});

let selectedRoomID = 0;

// Aktiveres når search-rooms knappen blir trykket på
$('#navbar-search-button').on('click', function (evt) {
    console.log("navbar search button clicked")
    // preventDefault stopper redirect
    evt.preventDefault();
    // Hent roomID fra text-feltet i navbaren
    const roomId = $('#navbar-search-input').val();
    // Varsle brukeren om roomID er mindre enn 0
    if (roomId < 0) {
        return alert("Room number is not correct! RoomID be higher than 0.");
    }
    getRoomInfo(roomId);
    $("#calendar").show();
    $("#searchResult").show();
});
$('#calendar input[type="date"]').val((new Date()).toISOString().substring(0, 10));
$('#calendar input[type="date"]').on('change', function (evt) {
    // console.log(evt.target.value);
});

$("#calendar button:nth-of-type(1)").on('click', function () {
    const strDate = $("#calendar input[type='date']").val();
    const arr = strDate.split("-").map(item => +item);
    const date = new Date(arr[0], arr[1] - 1, arr[2]);
    $('#calendar input[type="date"]').val(date.toISOString().substring(0, 10));
    //console.log(date, typeof date);
    console.log("[uos]selectedRoomID: ", selectedRoomID);
    getRoomInfo(selectedRoomID);
});

$("#calendar button:nth-of-type(2)").on('click', function () {
    const strDate = $("#calendar input[type='date']").val();
    const arr = strDate.split("-").map(item => +item);
    const date = new Date(arr[0], arr[1] - 1, arr[2] + 2);
    $('#calendar input[type="date"]').val(date.toISOString().substring(0, 10));
    //console.log(date, typeof date);
    console.log("[uos]selectedRoomID: ", selectedRoomID);
    getRoomInfo(selectedRoomID);
});

function Room(roomID, roomName, availableTimes = []) {
    this.roomID = roomID;
    this.roomName = roomName;
    this.availableTimes = availableTimes;
}

function StartEndPair(pairStartTime, pairEndTime) {
    this.pairStartTime = pairStartTime;
    this.pairEndTime = pairEndTime;
}

function displayCalendar() {
    $('#calendar input[type="date"]').val((new Date()).toISOString().substring(0, 10));
    $("#calendar").fadeIn(400);
}

function toggleCalAndResults() {
    if($("#searchResult").is(":hidden")) {
        showCalAndResults();
    } else {
        hideCalAndResults();
    }
}

function showCalAndResults() {
    console.log("showCalAndResults started");
    $('#calendar input[type="date"]').val((new Date()).toISOString().substring(0, 10));
    $("#calendar").fadeIn(400);
    $("#searchResult").fadeIn(400);
}

function hideCalAndResults() {
    console.log("hideCalAndResult started");
    $("#calendar").fadeOut(400);
    $("#searchResult").fadeOut(400);
}

function showRoomKeepUI(roomID) {
    let allrooms = roomID;
    getRoomInfo(allrooms);
}

function showAllRooms() {
    console.log("Show all rooms clicked");
    const roomId = -1;
    getRoomInfo(roomId);
    $("#calendar").show();
    $("#searchResult").show();
}

function cancelOrder(orderID) {
    if(window.confirm("Do you really wish to cancel this order?")) {
        let query = `action=cancel&orderID=${orderID}`;
        console.log("[uos]cancelOrder query: " + '/Roombooking_2_Web_exploded/Servlets.ServletReservations?' + query);
        $.post('/Roombooking_2_Web_exploded/Servlets.ServletReservations?' + query);

        setTimeout(function() {location.reload()}, 1000);
    }
}

function getRoomInfo(roomId) {
    let roomList = [];
    // if (roomId < 0) {
    // return alert("Room number is not correct! RoomID be higher than 0.");
    // }
    const date = $('#calendar input[type="date"]').val();
    /* Konstruer en query for bruk av HTTP GET
       Vil f.eks bli 'roomID=1&date=2019-10-26
    */
    //const query = `roomId=${roomId}&date=2019-11-13`;
    let query = `roomId=${roomId}&date=${date}`;
    console.log('/Roombooking_2_Web_exploded/Servlets.ServletSearch?' + query);

    $.get('/Roombooking_2_Web_exploded/Servlets.ServletSearch?' + query, function (response) {
        console.log('response = ', response);
        const data = JSON.parse(response);
        console.log('data', data);
        $("#searchResult > div:last-child").html('');
        if (!data.forEach) {
            $("#searchResult > div:last-child").html(data.error);
            return;
        }
        const rooms = {};
        if (roomId >= 0) {
            rooms[roomId] = [];
        }
        let roomIds = null;
        let roomNames = null;

        if (roomIds) {
            roomIds.forEach(roomId => {
                if (!rooms[roomId]) {
                    rooms[roomId] = [];
                }
            });
        }
        let formattedHTML = $('#searchResult').empty().html();

        formattedHTML += `<div class="room-result-container">`;
        let counter = 0;
        let mappedRooms = {};
        for (let id in rooms) {
            let newRoom = new Room();
            console.log('id = ', id);
            newRoom.roomID = id;
            //mappedRooms[id] = roomNames[counter];
            newRoom.roomName = mappedRooms[id];
            counter++;
            console.log("newRoom id=", newRoom.roomID);
            console.log("id to name=", mappedRooms[id]);
            //$("#searchResult > div:last-child").append($(`<div style="color: black; margin-top: 10px;">Room = ${id}</div>`));
            formattedHTML += `<div class="room-result">`;
            formattedHTML += `<div style="color: black; margin-top: 10px;"><h4>Available at:</h4></div>`;
            const data = rooms[id];
            let leftTimeBorder = "08:00";
            let rightTimeBorder = "22:00";
            const timePoints = [];
            timePoints.push(leftTimeBorder);
            data.forEach(function (room) {
                let startTime = room["start"];
                let endTime = room["end"];
                startTime = startTime.split(" ")[1].split(".")[0].split(":").slice(0, 2).join(":");
                endTime = endTime.split(" ")[1].split(".")[0].split(":").slice(0, 2).join(":");
                room["start"] = startTime;
                room["end"] = endTime;
                timePoints.push(startTime);
                timePoints.push(endTime);
            });
            timePoints.push(rightTimeBorder);
            const spareIntervals = [];
            for (let i = 0; i < timePoints.length; i += 2) {
                if (timePoints[i] !== timePoints[i + 1]) {
                    spareIntervals.push({
                        start: timePoints[i],
                        end: timePoints[i + 1],
                    });
                }
            }
            spareIntervals.forEach(function (interval) {
                const startTime = interval["start"];
                const endTime = interval["end"];
                let newPair = new StartEndPair(startTime, endTime);
                //const el = $(`<div>${startTime} - ${endTime}</div>`);
                //$("#searchResult > div:last-child").append(el);
                newRoom.availableTimes.push(newPair);
                const el = `<div>${startTime} - ${endTime}</div>`;
                console.log("startTime= ", startTime);
                console.log("endTime= ", endTime);
                formattedHTML += el;
            });
            console.log("times= ", newRoom.availableTimes);
            // Closing div for every room-result in the loop
            roomList.push(newRoom);
            formattedHTML += `</div>`;
        }
        // Closing div for room-result-container
        console.log(roomList);
        formattedHTML += `</div>`;
        $('#searchResult').append(formattedHTML);
    })
}

function scrollToUpdate(nthButton, newRoomName, setNewStartTime, setRoomID, orderNumber) {
    selectedRoomID = setRoomID;
    showCalAndResults();
    getRoomInfo(setRoomID);
    console.log("button to scroll to= ", nthButton);
    let update = document.getElementById('collapseUpdateBooking');
    $(update).collapse('show');
    $("#Update_orderID").val(nthButton);
    document.getElementById("Update_roomName").innerText = orderNumber;
    document.getElementById("Update_Timestamp_start_time").value = setNewStartTime;

    document.getElementById("Update_Timestamp_end_time").value = setNewStartTime;
    // stepUp increments the minutes of a time-field by a set amount, in this case 120 minutes.
    document.getElementById("Update_Timestamp_end_time").stepUp(120);

    let date = getCalendarDate();
    document.getElementById("Update_Timestamp_start_date").value = date;
    document.getElementById("Update_Timestamp_end_date").value = date;

    update.scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"});
    //update.scrollIntoView({behavior: "smooth"});
}

function getCalendarDate() {
    return $("#calendar input[type=date]").val();
}
