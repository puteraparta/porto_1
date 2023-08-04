var data = {};
var groups = {};
var map;

/*
 * Given a string `str`, replaces whitespaces with dashes,
 * and removes nonalphanumeric characters. Used in URL hash.
 */
var slugify = function(str) {
  return str.replace(/[^\w ]+/g,'').replace(/ +/g,'-');
}

/*
 * Resets map view to originally defined `mapCenter` and `mapZoom` in settings.js
 */
var resetView = function() {
  map.flyTo( mapCenter, mapZoom );
  resetSidebar();
}

/*
 * Resets sidebar, clearing out place info and leaving title+footer only
 */
var resetSidebar = function() {
    // Make the map title original color
    $('header').removeClass('black-50');

    // Clear placeInfo containers
    $('#placeInfo').addClass('dn');
    $('#placeInfo h2, #placeInfo h3').html('');
    $('#placeInfo div').html('');
    $('#googleMaps').addClass('dn').removeClass('dt');

    // Reset hash
    location.hash = '';
}

/*
 * Given a `marker` with data bound to it, update text and images in sidebar
 */
var updateSidebar = function(marker) {

  // Get data bound to the marker
  var d = marker.options.placeInfo;

  if (L.DomUtil.hasClass(marker._icon, 'markerActive')) {
    // Deselect current icon
    L.DomUtil.removeClass(marker._icon, 'markerActive');
    resetSidebar();
  } else {
    location.hash = d.slug;

    // Dim map's title
    $('header').addClass('black-50');
    $('#placeInfo').removeClass('dn');

    // Clear out active markers from all markers
    $('.markerActive').removeClass('markerActive');

    // Make clicked marker the new active marker
    L.DomUtil.addClass(marker._icon, 'markerActive');

    // Populate place information into the sidebar
    $('#placeInfo').animate({opacity: 0.5}, 300).promise().done(function() {
      $('#placeInfo h2').html(d.barcode_pohon);
      $('#placeInfo h3').html(d.nomor_pohon+' ( '+d.jenis_pohon+ ' )');
      $('#description').html(
        '<table>\
          <tr>\
            <th scope="row">Nomor Petak</th>\
            <td>'+d.nomor_petak+'</td>\
          </tr>\
          <tr>\
            <th scope="row">Luas Petak</th>\
            <td>'+d.luas_petak+' Ha </td>\
          </tr>\
          <tr>\
            <th scope="row">Latitude</th>\
            <td>'+d.Latitude+'</td>\
          </tr>\
          <tr>\
            <th scope="row">Longitude</th>\
            <td>'+d.Longitude+'</td>\
          </tr>\
          <tr>\
            <th scope="row">Nomor Jalur</th>\
            <td>'+d.nomor_jalur+'</td>\
          </tr>\
          <tr>\
            <th scope="row">Arah Jalur</th>\
            <td>'+d.arah_jalur+'</td>\
          </tr>\
          <tr>\
            <th scope="row">Panjang Pohon</th>\
            <td>'+d.panjang_pohon+' m </td>\
          </tr>\
          <tr>\
            <th scope="row">Pangkal Pohon</th>\
            <td>'+d.pangkal_pohon+' cm </td>\
          </tr>\
          <tr>\
            <th scope="row">Ujung Pohon</th>\
            <td>'+d.ujung_pohon+' cm </td>\
          </tr>\
          <tr>\
            <th scope="row">Rata-Rata Pohon</th>\
            <td>'+d.rata_rata_pohon+' cm </td>\
          </tr>\
          <tr>\
            <th scope="row">Volume Pohon</th>\
            <td>'+d.volume_pohon+' m<sup>3</sup> </td>\
          </tr>\
          <tr>\
            <th scope="row">Nomor Produk</th>\
            <td>'+d.no_produk+'</td>\
          </tr>\
        </table>'
      );
      
      if (d.chart_link) {
        $('#googleMaps').removeClass('dn').addClass('dt').attr('href', d.chart_link);
      } else {
        $('#googleMaps').addClass('dn').removeClass('dt');
      }

      $('#gallery').html('');
      $('#galleryIcon').hide();

      // Load up to 5 images
      for (var i = 1; i <= 5; i++) {
        var idx = 'Image' + i;

        if (d[idx]) {

          var source = "<em class='normal'>" + d[idx + 'Source'] + '</em>';

          if (source && d[idx + 'SourceLink']) {
           source = "<a href='" + d[idx + 'SourceLink'] + "' target='_blank'>" + source + "</a>";
           }

           var a = $('<a/>', {
            href: d[idx],
            'data-lightbox': 'gallery',
            //'data-title': ( d[idx + 'Caption'] + ' ' + source )  || '',
            'data-alt': d.barcode_pohon,
            'class': i === 1 ? '' : 'dn'
          });

          var img = $('<img/>', { src: d[idx], alt: d.barcode_pohon, class: 'dim br1' });
          $('#gallery').append( a.append(img) );

          if (i === 1) {
            $('#gallery').append(
              $('<p/>', { class: 'f6 black-50 mt1', html: d[idx + 'Caption'] + ' ' + source })
            );
          }

          if (i === 2) {
            $('#gallery > a:first-child').append('<span class="material-icons arrow arrow-right white-90">navigate_next</span>')
            $('#gallery > a:first-child').append('<span class="material-icons arrow arrow-left white-90">navigate_before</span>')
          }

        } else {
          break;
        }
      }

      $('#placeInfo h2').animate({ opacity: 1 }, 300);

      // Scroll sidebar to focus on the place's title
      $('#sidebar').animate({
        scrollTop: $('header').height() + 20
      }, 800);
    })
  }
}



/*
 * Main function that generates Leaflet markers from read CSV data
 */
var addMarkers = function(data) {

  var activeMarker;
  var hashName = decodeURIComponent( location.hash.substr(1) );

  for (var i in data) {
    var d = data[i];

   // Check if Latitude and Longitude are not undefined
   if (d.Latitude && d.Longitude) {
    // Create a slug for URL hash, and add to marker data
    d['slug'] = slugify(d.nomor_pohon);

    // Add an empty group if doesn't yet exist
    if (!groups[d.Group]) { groups[d.Group] = []; }

    // Create a new place marker
    var m = L.marker(
      [d.Latitude, d.Longitude],
      {  
        icon: L.icon({
          iconUrl: d.Icon,
          iconSize: [ iconWidth, iconHeight ],
          iconAnchor: [ iconWidth/2, 0 ], // middle of icon represents point center
          className: 'br1',
        }),
        // Pass place data
        placeInfo: d
      },
    ).on('click', function(e) {
      map.flyTo(this._latlng, 16);
      updateSidebar(this);
    });


    // Add this new place marker to an appropriate group
    groups[d.Group].push(m);

    if (d.slug === hashName) { activeMarker = m; }
  }
 }

  // Transform each array of markers into layerGroup
  for (var g in groups) {
    groups[g] = L.layerGroup(groups[g]);

    // By default, show all markers
    //groups['Sudah Tebang'].addTo(map);
  }
  
  L.control.layers({}, groups, {collapsed: true, position: 'topright'}).addTo(map);
  //$('.leaflet-control-layers-overlays').prepend('<h3 class="mt0 mb1 f5 black-30">Legend</h3>');

  // If name in hash, activate it
  if (activeMarker) { activeMarker.fire('click') }

}

/*
 * Loads and parses data from a CSV (either local, or published
 * from Google Sheets) using PapaParse
 */
var loadData = function(loc) {

  Papa.parse('https://raw.githubusercontent.com/armyputera/webmaprkt2023/main/data/Format_Web_SLJIV.csv', {
    header: true,
    download: true,
    complete: function(results) {
      addMarkers(results.data);
    }
  });

}

/*
 * Add home button
 */
var addHomeButton = function() {

  var homeControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },

    onAdd: function(map) {
      var container = L.DomUtil.create('span');
      container.className = 'db material-icons home-button black-80';
      container.innerText = 'map';
      container.onclick = function() {
        resetView();
      }

      return container;
    }
  })

  map.addControl(new homeControl);

}

/*
 * Main function to initialize the map, add baselayer, and add markers
 */
var initMap = function() {


  // Initial Map
  map = L.map('map', {
    center: mapCenter,
    zoom: mapZoom,
    tap: false, // to avoid issues in Safari, disable tap
    zoomControl: false,
  });


  // Add Basemaps
  // Add OSM Standard Basemap  
  map.createPane('pane_OSMStandard_0');
  map.getPane('pane_OSMStandard_0').style.zIndex = 5;
  var layer_OSMStandard_0 = L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    pane: 'pane_OSMStandard_0',
    opacity: 1.0,
    attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> \ contributors',
    minZoom: 1,
    maxZoom: 28,
    minNativeZoom:0,
    maxNativeZoom:19
  });

  // Add Google Terrain Basemap  
  map.createPane('pane_GoogleTerrain_1');
  map.getPane('pane_GoogleTerrain_1').style.zIndex = 6;
  var layer_GoogleTerrain_1 = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    pane: 'pane_GoogleTerrain_1',
    opacity: 1.0,
    attribution: '<a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2023 Google</a>',
    minZoom: 1,
    maxZoom: 28,
    minNativeZoom: 0,
    maxNativeZoom: 20
  });

  //Add Google Satellite Basemaps  
  map.createPane('pane_GoogleSatellite_2');
  map.getPane('pane_GoogleSatellite_2').style.zIndex = 4;
  var layer_GoogleSatellite_2 = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    pane: 'pane_GoogleSatellite_2',
    opacity: 1.0,
    attribution: '<a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2023 Google</a>',
    minZoom: 1,
    maxZoom: 28,
    minNativeZoom:0,
    maxNativeZoom: 20
  });
  layer_GoogleSatellite_2;
  map.addLayer(layer_GoogleSatellite_2)

// styling, and event listener to layer_BatasKawasan
 var layer_BatasKawasan;

  function style_bataskawasan(feature) {
    return {
      opacity: 1,
      color: 'rgba(35,35,35,1.0)',
      dashArray: '',
      lineCap: 'butt',
      lineJoin: 'miter',
      weight: 1.0,
      fill: true,
      fillOpacity: 1,
      fillColor: 'rgba(135,116,158,0.2)',
      interactive: true,
    }
  }

  map.createPane('pane_SumalindoLestariJayaIV');
  map.getPane('pane_SumalindoLestariJayaIV').style.zIndex = 1;
  map.getPane('pane_SumalindoLestariJayaIV').style['mix-blend-mode'] = 'normal';

  layer_BatasKawasan = L.geoJson(json_PAK2023,{
    attribution: '',
    interactive: true,
    dataVar: 'json_PAK2023',
    layerName: 'layer_PAK2023',
    style: style_bataskawasan
  
    //pane: 'pane_SumalindoLestariJayaIV'
  });
  map.addLayer(layer_BatasKawasan);

  //group basemaps
  basemaps= {
    "OpenStreetMap":layer_OSMStandard_0,
    "Google Terrain": layer_GoogleTerrain_1,
    "Google Satellite": layer_GoogleSatellite_2
  };

  // Add to map all basemaps
  L.control.layers(
    basemaps,{} ,{
    position:'bottomright',
    collapsed:false
  }).addTo(map);
  setBounds();


  // L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  //   subdomains: 'abcd',
  //   maxZoom: 19
  // }).addTo(map);

  loadData(dataLocation);

  // Add data & GitHub links
  map.attributionControl.setPrefix(' Go \
    to <a href="https://sljiv.sanimardani.com" target="_blank"> \
    Sumalindo Lestari Jaya IV</a> | <a href="http://leafletjs.com" title="A JS library\
    for interactive maps">Leaflet</a> | &#169; Sanimardani Resources 2023');

  // Add custom `home` control
  addHomeButton({
    position:'bottomright'
  });

  // Add zoom control to the bottom-right corner
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  $('#closeButton').on('click', resetView);
}

// When DOM is loaded, initialize the map
$('document').ready(initMap);
