window.onload = function () {

    var form = $(".recordForm");


    form.submit(function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        let time = new Date();
        let day = time.getDate();
        let month = time.getMonth() + 1;
        let year = time.getFullYear();

        time = time.getTime();

        let beginningOfToday = new Date(month + '-' + day + '-' + year).getTime();
        let beginningOfYesterday = new Date(month + '-' + (day - 1) + '-' + year).getTime();
        let beginningOfThisWeek = new Date(month + '-' + (day - 7) + '-' + year).getTime();

        let data = form.serializeArray();
        let dataArray = $(this).serializeArray();
        for(let i=0;i<dataArray.length;i++){
            data[dataArray[i].name] = dataArray[i].value;
        }


        if(data.time === "Today") {
            $.ajax({
                method: "POST",
                url: "getRecord",
                json: true,
                context: this,
                data: {
                    timeFrom: beginningOfToday,
                    timeTo: time,
                    id: $(this).parent().attr('id')
                },
                success: function(data) {showRecords(data)}
            });
        } else if (data.time === "Yesterday") {
            $.ajax({
                method: "POST",
                url: "getRecord",
                json: true,
                context: this,
                data: {
                    timeFrom: beginningOfYesterday,
                    timeTo: beginningOfToday,
                    id: $(this).parent().attr('id')
                },
                success: function(data) {showRecords(data)}
            });
        } else {
            $.ajax({
                method: "POST",
                url: "getRecord",
                json: true,
                context: this,
                data: {
                    timeFrom: beginningOfThisWeek,
                    timeTo: time,
                    id: $(this).parent().attr('id')
                },
                success: function(data) {showRecords(data)}
            });
        }
    });

    mainMapInit();

    function checkLocation(locationObj, item) {

        let i = 0;
        let added = false;
        for (i = 0; i < locationObj.length; i++){
            if (Math.abs(locationObj[i].latitude - item.latitude) < 0.01) {
                if (Math.abs(locationObj[i].longitude - item.longitude) < 0.01) {
                    if (item["update_time"] - locationObj[i]["update_time"] < 10000) {
                        locationObj[i].duration = item["update_time"] - locationObj[i]["create_time"];
                        locationObj[i]["update_time"] = item["update_time"];
                        added = true;
                        break;
                    }
                }
            }
        }
        return added ? i : -1;

    }


    function showRecords(data) {
        if (data.length > 0) {
            let recordMap = $("#listOfUsers").find(".show").find(".recordMap");

            let latTotal = 0;
            let lonTotal = 0;
            let num = data.length;

            let bounds = new google.maps.LatLngBounds();
            data.forEach(function (arrayItem) {
                bounds.extend(new google.maps.LatLng(parseFloat(arrayItem["latitude"]), parseFloat(arrayItem["longitude"])));
                latTotal += parseFloat(arrayItem["latitude"]);
                lonTotal += parseFloat(arrayItem["longitude"]);
            });
            let avrLat = latTotal / num;
            let avrLon = lonTotal / num;

            recordMap.attr("style", "width:100%");
            recordMap.attr("style", "height:400px");

            let center = new google.maps.LatLng(avrLat, avrLon);

            let map = new google.maps.Map(recordMap[0], {
                zoom: 12,
                center: center,
            });

            map.fitBounds(bounds);
            map.setZoom(map.getZoom() - 1);

            let locationObj = [];

            data.forEach(function (item) {

                var geocoder = new google.maps.Geocoder();

                let i = checkLocation(locationObj, item);

                if (i > -1) {
                    $("#" + locationObj[i]["update_time"] + "marker > .duration").html((locationObj[i].duration / 1000) + " sec");
                } else {
                    locationObj.push({
                        latitude: item["latitude"],
                        longitude: item["longitude"],
                        update_time: item["update_time"],
                        create_time: item["update_time"],
                        duration: 0,
                    });
                    let i = locationObj.length - 1;
                    let content = "<div id='" + item["update_time"] + "marker'><p class='time'>" +
                        "</p><p class='address'>" +
                        "</p><p class='duration'>" +
                        "</p>" +
                        "</div>";

                    let infoWindow = new google.maps.InfoWindow({
                        content: content
                    });

                    let pointer = new google.maps.Marker({
                        map: map,
                        position: new google.maps.LatLng(item["latitude"], item["longitude"])
                    });

                    pointer.addListener("click", function () {
                        infoWindow.open(map, pointer);

                        geocoder.geocode({
                            location: {
                                lat: parseFloat(item["latitude"]),
                                lng: parseFloat(item["longitude"])
                            }
                        }, function (results, status) {
                            $("#" + item["update_time"] + "marker > .time").html(formatTime(Number(item["update_time"])));
                            $("#" + item["update_time"] + "marker > .address").html(results[0].formatted_address);
                            $("#" + item["update_time"] + "marker > .duration").html(formatDuration(locationObj[i].duration));
                        });

                    })
                }
            });

            let directionsService = new google.maps.DirectionsService();
            let directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);

            let latAndLong = [];
            locationObj.forEach(function(point) {
                latAndLong.push({lat: Number(point.latitude), lng: Number(point.longitude)});
            });

            let requestObj = {
                origin: latAndLong[0],
                destination: latAndLong[latAndLong.length - 1],
                waypoints: latAndLong.slice(1, latAndLong.length - 1).map((obj) => {
                    return {location: obj, stopover: false}
                }),
                travelMode: "DRIVING",
                optimizeWaypoints: false,
                provideRouteAlternatives: false,
                avoidFerries: false,
                avoidHighways: false,
                avoidTolls: false,

            };

            directionsService.route(requestObj, function(result, status) {
                if (status === "OK") {
                    directionsDisplay.setDirections(result);
                } else {
                    let polyLine = new google.maps.Polyline({
                        path: latAndLong,
                        map: map,
                        geodesic: false,
                        strokeWeight: 1,
                        strokeColor: '#000000'
                    });
                }
            });


        }
    }

    function formatTime(milis) {
        let time = new Date(milis);
        let hour = time.getHours();
        let minutes = time.getMinutes();
        let seconds = time.getSeconds();

        return hour + ":" + minutes + ":" + seconds;
    }

    function formatDuration(milis) {
        let hour = Math.floor(milis / 3600000);
        let minutes = Math.floor((milis % 3600000) / 60000);
        let seconds = Math.floor((milis % 60000) / 1000);

        return hour + ":" + minutes + ":" + seconds;
    }

    function showCurrent() {
        $.ajax({
            method: "POST",
            url: "getCurrent",
            json: true,
            context: this,
            success: function(data) {
                if (data.length > 0) {
                    let bounds = new google.maps.LatLngBounds();
                    for (let i = 0; i < data.length; i++) {
                        let user = Object.keys(data[i])[0];

                        if ($.inArray(user, Object.keys(window.users)) === -1) {
                            window.users[user] = Number(data[i][user][0]["update_time"]);
                        }

                        let lat = parseFloat(data[i][Object.keys(data[i])][0]["latitude"]);
                        let long = parseFloat(data[i][Object.keys(data[i])][0]["longitude"]);

                        bounds.extend(new google.maps.LatLng(lat, long));


                        let time = new Date(Number(data[i][Object.keys(data[i])][i]["update_time"])).toLocaleString();

                        let contentString = "<div id='" + user + "tooltip'><p><strong> " + user + "</strong>" +
                            "</p>" +
                            "<p class='time'>Date: " + time +
                            "</p>" +
                            "<p class='loc'>Latitude: " + lat + "<br /> Longitude:" + long +
                            "</p>" +
                            "</div>";

                        var infowindow = new google.maps.InfoWindow({
                            content: contentString
                        });

                        let updatedMarker = false;

                        for (let marker of window.markers) {
                            if (marker.getTitle() === user) {
                                marker.setPosition(new google.maps.LatLng(lat, long));
                                $("#" + user + "tooltip > .time").html(time);
                                $("#" + user + "tooltip > .loc").html("Latitude: " + lat + "<br /> Longitude: " + long);
                                updatedMarker = true;
                                break;
                            }
                        }

                        if (!updatedMarker) {
                            currentMarker = new google.maps.Marker({
                                map: window.map,
                                position: new google.maps.LatLng(lat, long),
                                label: user[0],
                                title: user
                            });

                            currentMarker.addListener("click", function () {
                                infowindow.open(window.map, currentMarker);
                            });

                            window.markers.push(currentMarker);
                        }
                    }
                    // for (let user of Object.keys(window.users)) {
                    //     if (window.users[user] < (new Date().getTime() - 10000)) {
                    //         delete window.users[user];
                    //         for (let marker of window.markers) {
                    //             if (marker.getTitle() === user) {
                    //                 marker.setMap(null);
                    //             }
                    //         }
                    //     }
                    // }
                    window.map.fitBounds(bounds);
                    map.setZoom(map.getZoom()-3);
                } else {
                    for (let i = 0; i < window.markers.length; i++){
                        window.markers[i].setMap(null);
                        window.markers.splice(i, 1);
                    }
                }
            }
        });
    }

//----------------------- Map Init and controls -------------------------------------

    function mainMapInit() {
        window.map = new google.maps.Map(document.getElementById("map"), {
            zoom: 12,
            center: new google.maps.LatLng(52.21068279166667, 6.862302608333334)
        });
        window.markers = [];
        window.users = {};
        window.smallestLat = 0;
        window.smallestLng = 0;
        window.biggestLat = 0;
        window.biggestLng = 0;
        setInterval(showCurrent, (2000));

        // var centerControlDiv = document.createElement('div');
        // centerControlDiv.id = "newUIControl";
        // centerControlDiv.style.height = "30px";
        // centerControlDiv.style.width = "100px";
        // var centerControl = new CenterControl(centerControlDiv, map);
        //
        // centerControlDiv.index = 1;
        // window.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
    }


    // function CenterControl(controlDiv, map) {
    //
    //     // Set CSS for the control interior.
    //     $("#newUIControl").html("<a data-toggle='collapse' data-target='uiCollapse' aria-expanded='false' aria-controls='uiCollapse'><strong>Choose a person</strong></a>");
    //
    //     var controlCollapse = controlToggle.append("<div class='collapse' id='uiCollapse'>");
    //
    //     var controlForm = controlCollapse.append("<form class='form-inline'>");
    //
    //     var controlSelect = controlForm.append("<select>");
    //     controlSelect.attr("id", "newUISelect");
    //
    //     controlOptions();
    //
    //     controlSelect.append("</select></form></div>");
    //
    //     // Setup the click event listeners.
    //     controlForm.on("submit", function(data) {
    //         alert(data);
    //     });
    // }
    //
    // function controlOptions() {
    //     let options = "";
    //     for (let user of window.users) {
    //         options += "<option name=" + user + ">" + user + "</option>\n";
    //     }
    //     $("#newUISelect").html(options);
    // }

};





