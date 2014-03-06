window.TW = window.TW || {};

(function(TW, self, undefined){

	var markerLocations = [],
	
	makeButton = document.getElementById("make"),

	config = {
		samplePoints: 8
	},

	map = TW.Setup.getMap();

	function addOriginalPoint(event){
		if ( markerLocations.length == 2){
			return;
		}
		var clickedLocation = event.latLng;
		var clickedPosition = new google.maps.LatLng(clickedLocation.d, clickedLocation.e);
		var marker = new google.maps.Marker({
			map:map,
			draggable:true,
			animation: google.maps.Animation.DROP,
			position: clickedPosition
		});
		markerLocations.push(marker);
		if(markerLocations.length > 1){
			makeButton.disabled = false;
		}
		marker.setMap(map);
	};

  	function makeGrid(){
  		var lat1 = markerLocations[0].getPosition().d;
  		var lon1 = markerLocations[0].getPosition().e;
  		var lat2 = markerLocations[1].getPosition().d;
  		var lon2 = markerLocations[1].getPosition().e;
  		var gridOne = new Grid(lat1, lon1, lat2, lon2, config.samplePoints);
  		gridOne.showMidPoint();
  		gridOne.connectOrigins();
  		gridOne.findHalf();
  		gridOne.segmentLine();
  	};
 
  	function Grid(lat1, lon1, lat2, lon2, points){

  		this.lat1 = lat1;
  		this.lon1 = lon1;
  		this.lat2 = lat2;
  		this.lon2 = lon2;
  		this.points = points;
  		var radLat1 = (lat1).toRad();
  		var radLat2 = (lat2).toRad();
  		var radLon1 = (lon1).toRad();
  		var radLon2 = (lon2).toRad();
  		var locationOne = new google.maps.LatLng(lat1, lon1);
		var locationTwo = new google.maps.LatLng(lat2, lon2);
		var pointsArr = []
 		
  		this.showMidPoint = function(){
			var dLon = ((lon2 - lon1)).toRad();
			var Bx = Math.cos(radLat2) * Math.cos(dLon);
			var By = Math.cos(radLat2) * Math.sin(dLon);
			var lat3 = Math.atan2(Math.sin(radLat1) + Math.sin(radLat2), Math.sqrt((Math.cos(radLat1) + Bx) * (Math.cos(radLat1) + Bx) + By * By));
			var lon3 = radLon1 + Math.atan2(By, Math.cos(radLat1) + Bx);
			lat3 = (lat3).toDeg();
			lon3 = (lon3).toDeg();
			this.setMarker(lat3, lon3); 
  		}

  		this.findBearing = function(){
  			var dLon = (radLon2-radLon1);
		    var y = Math.sin(dLon) * Math.cos(radLat2);
			var x = Math.cos(radLat1)*Math.sin(radLat2) -
			        Math.sin(radLat1)*Math.cos(radLat2)*Math.cos(dLon);
			var brng = Math.atan2(y, x);
			return brng;
  		}

  		this.findHalf = function(){
  			//first need to find the bearing
  			var dLon = (radLon2-radLon1);
		    var y = Math.sin(dLon) * Math.cos(radLat2);
			var x = Math.cos(radLat1)*Math.sin(radLat2) -
			        Math.sin(radLat1)*Math.cos(radLat2)*Math.cos(dLon);
			var brng = Math.atan2(y, x);
			
			var wholeDistanceKm = this.getDistance() * .001;
			
			var R = 6378.1 ;
			var d = wholeDistanceKm / 2; 
			
			newLat = Math.asin( Math.sin(radLat1)*Math.cos(d/R) +
			     Math.cos(radLat1)*Math.sin(d/R)*Math.cos(brng))
			newLon = radLon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(radLat1),
			             Math.cos(d/R)-Math.sin(radLat1)*Math.sin(newLat))
			this.setMarker(newLat.toDeg(), newLon.toDeg());
  		}

  		this.segmentLine = function(){
  			var segmentLength = (this.getDistance() * .001) / points;
  			var R = 6378.1 ;
			var d = segmentLength;
  			//var brng = this.findBearing();
			pointsArr.push({
				'lat' : lat1,
				'lon' : lon1 
			});
			for( i=0; i < points; i++ ){
				var newPointLatInRad = pointsArr[i]['lat'].toRad();
				var newPointLonInRad = pointsArr[i]['lon'].toRad();

				//find bearing
				var dLon = (radLon2-newPointLonInRad);
			    var y = Math.sin(dLon) * Math.cos(radLat2);
				var x = Math.cos(newPointLatInRad)*Math.sin(radLat2) -
				        Math.sin(newPointLatInRad)*Math.cos(radLat2)*Math.cos(dLon);
				var brng = Math.atan2(y, x);


				
				var newLat = Math.asin( Math.sin(newPointLatInRad)*Math.cos(d/R) +
				     Math.cos(newPointLatInRad)*Math.sin(d/R)*Math.cos(brng))
				var newLon = newPointLonInRad + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(newPointLatInRad),
				             Math.cos(d/R)-Math.sin(newPointLatInRad)*Math.sin(newLat));
				this.setMarker(newLat.toDeg(), newLon.toDeg()); 
				pointsArr.push({
					'lat' : newLat.toDeg(),
					'lon' : newLon.toDeg() 
				});
			}
			console.log(pointsArr);
  		}

  		this.connectOrigins = function(){
  			this.makeLine(lat1, lon1, lat2, lon2, '#0000FF' );
  		}

  		this.getDistance = function(){
			var distance = google.maps.geometry.spherical.computeDistanceBetween(
				locationOne,
				locationTwo
			);
			return distance;
  		}
  	}

  	Grid.prototype.setMarker = function(lat, lon) {
    	var markerPosition = new google.maps.LatLng(lat, lon);
		marker = new google.maps.Marker({
			map:map,
			draggable:false,
			animation: google.maps.Animation.DROP,
			position: markerPosition
		}); 
		marker.setMap(map);
	};

	Grid.prototype.makeLine = function(lat1, lon1, lat2, lon2, color) {
		var flightPlanCoordinates = [
			new google.maps.LatLng(lat1, lon1),
			new google.maps.LatLng(lat2, lon2)
		];
		var lineColor = (color) ? color : '#FF0000';
		var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: lineColor,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		flightPath.setMap(map);
	};

	function bindDomEvents(){
		makeButton.disabled = true;
		google.maps.event.addListener(map, 'click', addOriginalPoint);
		makeButton.addEventListener("click", makeGrid );
	};

    function init() {
    	bindDomEvents();
    } 

    init();

}(TW, TW.Main = TW.Main || {} ));


