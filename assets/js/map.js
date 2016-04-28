String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


L.mapbox.accessToken = 'pk.eyJ1IjoiZ3JhaGFtd2FsdGVycyIsImEiOiJjaW5rMmtuc2wwMDZpdnhseThrNWxhOHB1In0.WSC9YeNHR1qpgKFdpcU5jQ';

var map = L.mapbox.map('map', 'mapbox.streets', {
    accessToken: L.mapbox.accessToken
}).setView([57, -3.9], 7);



var waveConfig = liquidFillGaugeDefaultSettings();
waveConfig.circleColor = "#005b99";
waveConfig.textColor = "#FF4444";
waveConfig.waveTextColor = "#FFFFFF";
waveConfig.waveColor = "#0088cc";
waveConfig.circleThickness = 0.2;
waveConfig.textVertPosition = 0.2;
waveConfig.waveAnimateTime = 1000;
waveConfig.waveHeight = 0.1;
waveConfig.waveCount = 2;
waveConfig.maxValue = 10;
var waveGauge = loadLiquidFillGauge('wave-gauge', 0, waveConfig);



var Custom = L.Icon.extend({
    options: {
        iconSize: [37, 50],
        iconAnchor: [18, 50],
        popupAnchor: [0, -40]
    }
});

var layers = {
    wall:   {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/wall.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    scenic: {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/scenic.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    reef:   {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/reef.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    shore:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/shore.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    wreck:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/wreck.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    river:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/river.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    slope:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/slope.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    drift:  {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/drift.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    },
    quarry: {
        enabled: true,
        icon:  new Custom({ iconUrl: 'assets/pins/quarry.png'}),
        layer: L.mapbox.featureLayer(null).addTo(map),
        json: []
    }
};


$.getJSON('map.json', function(data) {
    _.each(data, function(location) {
        _.each(location.types, function(type) {
            type = type.toLowerCase();

            location.type = type.capitalizeFirstLetter();

            layers[type].json.push({
              "type": "Feature",
              "properties": _.clone(location),
              "geometry": {
                "type": "Point",
                "coordinates": [
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

            marker.setIcon(layers[properties.type.toLowerCase()].icon);

            marker.on('click', pinClick);

            marker.bindPopup(
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

    $.ajax({
        type: "GET",
        url: 'http://api.worldweatheronline.com/free/v2/marine.ashx?key=0fbc35e0628487e81910acbe88c6e&format=json&tide=yes&q=' + pin.getLatLng().lat + ',' + pin.getLatLng().lng,
        dataType: "json",
        success: function (json) {
            if (! pin._popup._isOpen) return;

            var swellHeight   = json.data.weather[0].hourly[0].swellHeight_m;
            var waterTemp     = json.data.weather[0].hourly[0].waterTemp_C;
            var winddirDegree = json.data.weather[0].hourly[0].winddirDegree;

            console.log(swellHeight, waterTemp, winddirDegree, json.data.weather[0].hourly[0]);


            waveGauge.update(swellHeight);

            $('.compass-arrow').css({
                'display': 'block',
                '-webkit-transform': 'rotate(' + winddirDegree + 'deg)',
                '-moz-transform': 'rotate(' + winddirDegree + 'deg)'
            });

            // var dsplace = document.getElementById('dsplace');

            // if (waterTemp > 9 && waterTemp < 26) {
            //     dsplace.src = "assets/img/wetsuit.png";
            // } else if (waterTemp < 9) {
            //     dsplace.src = "assets/img/drysuit.png";
            // } else if (waterTemp > 25) {
            //     dsplace.src = "assets/img/swimwear.png";
            // }
        }
    });
}

map.on('popupclose', function(e) {
    waveGauge.update(0);

    $('.compass-arrow').css('display', 'none');
});



var experienceImg = document.getElementById('dive-experience');

var experiences = ["all", "novice", "ocean", "sport", "master"];
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

$("#experience-plus").click(function(event) {
    if (current_experience < experiences.length-1) {
        current_experience++;
        updateExperience();
    }
});

$("#experience-minus").click(function(event) {
    if (current_experience > 0) {
        current_experience--;
        updateExperience();
    }
});





console.log('setup', 'done');
