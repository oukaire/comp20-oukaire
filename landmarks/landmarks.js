var myLat = 0;
var myLng = 0;
var myDst = "";
var nearestLmk = "";
var nearestLat = myLat;
var nearestLng = myLng;
var xhr = new XMLHttpRequest();
var me  = new google.maps.LatLng(myLat, myLng);
var infoWindow = new google.maps.InfoWindow();
var myOptions = {
    zoom: 13,
    center: me,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};
var iconPpl = {
    url: 'icons/pins.png',
    size:   new google.maps.Size(24, 24),
    origin: new google.maps.Point(0, 72),
    anchor: new google.maps.Point(0, 96)
};
var iconLmk = {
    url: 'icons/pins.png',
    size:   new google.maps.Size(24, 22),
    origin: new google.maps.Point(0, 25),
    anchor: new google.maps.Point(0, 48)
};
var map; 
var myMarker;                      
var markerPpl;
var markerLmks;

function initMap()
{
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    getMyLocation();
}

function getMyLocation() {

    function success(crd) {
        myLat = crd.coords.latitude;
        myLng = crd.coords.longitude;
        displayMe();
    };

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    navigator.geolocation.getCurrentPosition(success, error);
}

function displayMe() {

    me = new google.maps.LatLng(myLat, myLng);
    map.panTo(me);
    
    myMarker = new google.maps.Marker({
        position: me,
        title: '<div class="infowindows">Here I Am!</div>',
        map: map
    });
    myMarker.setMap(map);

    google.maps.event.addListener(myMarker, 'click', function() {
        infoWindow.setContent(myMarker.title + nearestLmk +  "<br>" + meterstomiles(myDst));
        infoWindow.open(map, myMarker);

        var nearestLmkPathCoordinates = [
            {lat: myLat, lng: myLng},
            {lat: nearestLat, lng: nearestLng}
        ];
        var nearestLmkPath = new google.maps.Polyline({
            path: nearestLmkPathCoordinates,
            geodesic: true,
            strokeColor: '#000000', /* black */
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        nearestLmkPath.setMap(map);
    });
    displayOthers();
}

function displayOthers() {
    xhr.open("POST", "https://landmarkz.herokuapp.com/sendLocation", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    function callback () {
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            rawData = xhr.responseText;
            data    = JSON.parse(rawData);
            
            data.people.forEach(function (person) {
                pos = new google.maps.LatLng(person.lat, person.lng);
                dst = google.maps.geometry.spherical.computeDistanceBetween(me, pos);
                markerPpl = new google.maps.Marker({
                    position: pos,
                    icon: iconPpl,
                    map: map,
                    title: person.login + "<br>distance away: " + meterstomiles(dst) + "</br>"        
                });
                markerPpl.setMap(map);

                google.maps.event.addListener(markerPpl, 'click', function() {
                    infoWindow.setContent(this.title);
                    infoWindow.open(map, this);
                });
            });

            displayLmks(data.landmarks, markerLmks, iconLmk);
        }
    }

    xhr.onreadystatechange = callback;
    xhr.send("login=SrmNO5wg&lat=" + myLat + "&lng=" + myLng);
}

function displayLmks(data, marker, marker_icn) {
    var count = 0;
    data.forEach(function (elem) {
        pos = new google.maps.LatLng(elem.geometry.coordinates[1], elem.geometry.coordinates[0]);
        dst = google.maps.geometry.spherical.computeDistanceBetween(me, pos);

        if (count == 0) {
            myDst = dst;
            nearestLmk = elem.properties.Location_Name;
            updateNeareastLmkLatLng(elem.geometry.coordinates[1], elem.geometry.coordinates[0]);
            count++;
        }
        if (myDst > dst) {
            myDst = dst;
            nearestLmk = elem.properties.Location_Name;
            updateNeareastLmkLatLng(elem.geometry.coordinates[1], elem.geometry.coordinates[0]);
        }

        markerLmks = new google.maps.Marker({
            position: pos,
            icon: iconLmk,
            map: map,
            title: elem.properties.Details,
            map_icon_label: '<span class="map-icon"></span>'       
        });
        markerLmks.setMap(map);

        google.maps.event.addListener(markerLmks, 'click', function() {
            infoWindow.setContent(this.title);
            infoWindow.open(map, this); 
        });
    });
}

function updateNeareastLmkLatLng(lat, lng)
{
    nearestLat = lat;
    nearestLng = lng;
}