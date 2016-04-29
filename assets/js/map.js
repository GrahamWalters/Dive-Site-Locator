String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


L.mapbox.accessToken = 'pk.eyJ1IjoiZ3JhaGFtd2FsdGVycyIsImEiOiJjaW5rMmtuc2wwMDZpdnhseThrNWxhOHB1In0.WSC9YeNHR1qpgKFdpcU5jQ';

var map = L.mapbox.map('map', 'mapbox.streets', {
    accessToken: L.mapbox.accessToken
}).setView([57, -3.9], 7);



var waveConfig = liquidFillGaugeDefaultSettings();
waveConfig.circleColor = '#005b99';
waveConfig.textColor = '#FF4444';
waveConfig.waveTextColor = '#FFFFFF';
waveConfig.waveColor = '#0088cc';
waveConfig.circleThickness = 0.2;
waveConfig.textVertPosition = 0.2;
waveConfig.waveAnimateTime = 1000;
waveConfig.waveHeight = 0.1;
waveConfig.waveCount = 2;
waveConfig.maxValue = 10;
var waveGauge = loadLiquidFillGauge('wave-gauge', 0, waveConfig);



var Custom = L.Icon.extend({
    options: {
        iconSize: [30, 37],
        iconAnchor: [15, 37],
        popupAnchor: [0, -30]
    }
});

var selectIcon = new Custom({ iconUrl: 'assets/pins/select.png' });
var userIcon   = new Custom({ iconUrl: 'assets/pins/me.png' });


var layers = {
    wall:   {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/wall.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    scenic: {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/scenic.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    reef:   {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/reef.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    shore:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/shore.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    wreck:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/wreck.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    river:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/river.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    slope:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/slope.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    drift:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/drift.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    quarry: {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/quarry.png' }),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    }
};

var searchValues = [];
var allMarkers = {};


$.getJSON('map.json', function(data) {
    _.each(data, function(location) {
        searchValues.push(location.name);

        _.each(location.types, function(type) {
            type = type.toLowerCase();

            location.type = type.capitalizeFirstLetter();

            layers[type].json.push({
              'type': 'Feature',
              'properties': _.clone(location),
              'geometry': {
                'type': 'Point',
                'coordinates': [
                  location.long,
                  location.lat
                ]
              }
            });
        });
    });


    _.each(layers, function(value) {
        value.layer.on('layeradd', function(e) {
            var marker = e.layer;
            var properties = marker.feature.properties;

            allMarkers[marker.feature.properties.name] = marker;

            marker
                .setIcon(layers[properties.type.toLowerCase()].icon)
                .on('click', pinClick)
                .bindPopup(
                    '<b>Name: </b>'                   +properties.name+'<br>'+
                    '<b>Recommended Experience: </b>' +properties.experience+'<br>'+
                    '<b>Lat/Lng: </b>'                +properties.lat+', '+properties.long+'<br>'+
                    '<b>Type: </b>'                   +properties.type+'<br>'+
                    '<b>Depth: </b>'                  +properties.depth+' metres'
            );
        });


        value.layer.setGeoJSON(value.json);
    });
});


_.each(layers, function(value, key) {
    $('#'+key+'Button').click(function(event) {
        if (value.enabled) {
            map.removeLayer(value.layer);

            $(this).css({ opacity: 0.5 });

            value.enabled = false;
        } else {
            map.addLayer(value.layer);

            $(this).css({ opacity: 1 });

            value.enabled = true;
        }
    });
});


function pinClick(e) {
    var pin = this;

    if (compare.active) comparePin(this);

    $.ajax({
        type: 'GET',
        url: 'http://api.worldweatheronline.com/free/v2/marine.ashx?key=0fbc35e0628487e81910acbe88c6e&format=json&tide=yes&q=' + pin.getLatLng().lat + ',' + pin.getLatLng().lng,
        dataType: 'json',
        success: function (json) {
            if (! pin._popup._isOpen) return;

            var swellHeight   = json.data.weather[0].hourly[0].swellHeight_m;
            var waterTemp     = json.data.weather[0].hourly[0].waterTemp_C;
            var winddirDegree = json.data.weather[0].hourly[0].winddirDegree;


            waveGauge.update(swellHeight);

            $('.compass-arrow').css({
                'display': 'block',
                '-webkit-transform': 'rotate(' + winddirDegree + 'deg)',
                '-moz-transform': 'rotate(' + winddirDegree + 'deg)'
            });

            // var dsplace = document.getElementById('dsplace');

            // if (waterTemp > 9 && waterTemp < 26) {
            //     dsplace.src = 'assets/img/wetsuit.png';
            // } else if (waterTemp < 9) {
            //     dsplace.src = 'assets/img/drysuit.png';
            // } else if (waterTemp > 25) {
            //     dsplace.src = 'assets/img/swimwear.png';
            // }
        }
    });
}

map.on('popupclose', function(e) {
    waveGauge.update(0);

    $('.compass-arrow').css('display', 'none');
});



var experienceImg = document.getElementById('dive-experience');

var experiences = ['all', 'novice', 'ocean', 'sport', 'master'];
var current_experience = 0;

function updateExperience() {
    _.each(layers, function(layer) {
        layer.layer.setFilter(function(pin) {
            if (current_experience === 0) {
                return true;
            } else {
                return (pin.properties.experience+'').toLowerCase() === experiences[current_experience];
            }
        });
    });

    experienceImg.src = 'assets/img/'+experiences[current_experience]+'.png';
}

$('#experience-plus').click(function(event) {
    if (current_experience < experiences.length-1) {
        current_experience++;
        updateExperience();
    }
});

$('#experience-minus').click(function(event) {
    if (current_experience > 0) {
        current_experience--;
        updateExperience();
    }
});




function searchFilter(search) {
    search = search.toLowerCase();

    _.each(layers, function(layer) {
        layer.layer.setFilter(function(pin) {
            return pin.properties.name.toLowerCase().indexOf(search) > -1;
        });
    });
}

$('#search').keyup(function(e) {
    var string = e.currentTarget.value;

    searchFilter(string);
});

$('#search').autocomplete({
    source: searchValues,
    select: function(event, ui) {
        searchFilter(ui.item.value);

        var pin = allMarkers[ui.item.value];
        map.setView(pin._latlng, 11, {
            animate: true,
            duration: 1
        });
        pin.openPopup();
    }
});




$('.findNearestDiveSite').on('click', function() {
    if (! navigator.geolocation) {
        $(this).html('Geolocation not Available');
        return;
    }

    map.locate();

    map.on('locationfound', function(e) {
        L.marker([e.latlng.lat, e.latlng.lng], {
            icon: userIcon,
            user: true
        }).bindPopup('YOUR LOCATION').addTo(map);


        var pins = [];
        _.each(layers, function(layer) {
            var json = layer.layer.getGeoJSON();
            pins.push.apply(pins, json);
        });

        var gj = L.geoJson(pins);
        var nearest = leafletKnn(gj).nearest(e.latlng, 1)[0];

        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker && layer.getLatLng().equals(nearest)) {
                layer.openPopup();
            }
        });

        map.setView(nearest, 11, {
            animate: true,
            duration: 1
        });
    });

    map.on('locationerror', function() {
        $(this).html('Position could not be found');
    });
});



var compare = {
    active: false,
    pins: []
};

function comparePin(pin) {
    if (! compare.active) return false;

    if (compare.pins[0] && compare.pins[0]._leaflet_id == pin._leaflet_id) {
        delete compare.pins[0];
        pin.setIcon(layers[pin.feature.properties.type.toLowerCase()].icon);
    } else if (compare.pins[1] && compare.pins[1]._leaflet_id == pin._leaflet_id) {
        delete compare.pins[1];
        pin.setIcon(layers[pin.feature.properties.type.toLowerCase()].icon);
    } else {
        compare.pins.push(pin);
        pin.setIcon(selectIcon);
    }

    if (compare.pins.length === 2) {
        // compare
        $('#compareModal').modal();

        var myTable = document.getElementById('table');
        _.each(compare.pins, function(pin, key) {
            pin = pin.feature.properties;

            myTable.rows[0].cells[key + 1].innerHTML = pin.name;
            myTable.rows[1].cells[key + 1].innerHTML = pin.lat + ', ' + pin.long;
            myTable.rows[2].cells[key + 1].innerHTML = pin.type;
            myTable.rows[3].cells[key + 1].innerHTML = pin.experience;
            myTable.rows[4].cells[key + 1].innerHTML = pin.depth + ' M';

            (function(key) {
                $.ajax({
                    type: 'GET',
                    url: 'http://api.worldweatheronline.com/free/v2/marine.ashx?key=0fbc35e0628487e81910acbe88c6e&format=json&tide=yes&q=' + pin.lat + ',' + pin.long,
                    dataType: 'json',
                    success: function (json) {
                        var temp          = json.data.weather[0].hourly[0].tempC;
                        var windspeed     = json.data.weather[0].hourly[0].windspeedMiles;
                        var waterTemp     = json.data.weather[0].hourly[0].waterTemp_C;

                        myTable.rows[5].cells[key + 1].innerHTML = temp + '°C';
                        myTable.rows[6].cells[key + 1].innerHTML = windspeed + 'MPH';
                        myTable.rows[7].cells[key + 1].innerHTML = waterTemp + '°C';
                    }
                });
            })(key);
        });
    }
}

function resetCompare() {
    _.each(compare.pins, function(pin, key) {
        pin.setIcon(layers[pin.feature.properties.type.toLowerCase()].icon);
    });

    compare.pins = [];
    $('.compareDiveSites').toggleClass('btn-default btn-primary');
}

$('.compareDiveSites').on('click', function() {
    compare.active = !compare.active;
    resetCompare();
});

$('#compareModal').on('hidden.bs.modal', function(e) {
    compare.active = false;
    resetCompare();
});


