var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function (lobby) {
        console.info('Connecting to WS...' + lobby);
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint.'+ lobby, function (eventbody) {  
                var theObject = JSON.parse(eventbody.body);  
                console.info("Lobby: " + lobby);
                //alert(eventbody);
                //La función addPointToCavas crea circulos de radio 1.5 y en el enunciado pedia radio 1 
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.beginPath();
                ctx.arc(theObject.x,theObject.y,2,0,2*Math.PI);
                ctx.stroke();
            });
            stompClient.subscribe('/topic/newpolygon.'+lobby, function (points) {   
                var polygonJS = JSON.parse(points.body);
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.fillStyle = '#26C8ED';
                ctx.beginPath();
                ctx.moveTo(polygonJS[0].x, polygonJS[0].y);
                for (i = 1; i < polygonJS.length; i++) {
                    ctx.lineTo(polygonJS[i].x, polygonJS[i].y);
                }
                ctx.closePath();
                ctx.stroke();
                
            });
            
        });

    };
   
    return {

        init: function () {
            var can = document.getElementById("canvas");     
            can.addEventListener('click', function(event){
               var lb = document.getElementById("lobby").value;
               stompClient.send("/app/newpoint."+lb, {}, JSON.stringify(new Point(getMousePosition(event).x,getMousePosition(event).y)));
               //app.publishPoint(getMousePosition(event).x,getMousePosition(event).y);
            });
            
            //websocket connection
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            
            //addPointToCanvas(pt);        
            //publicar el evento
            stompClient.send("/topic/newpoint.", {}, JSON.stringify(pt)); 
            
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        },
        
        tryConnect: function(lobby){
            connectAndSubscribe(lobby);
        }        
    };

})();