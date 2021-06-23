<p align="center">
    <img width="600" src="https://www.competitionlabs.com/wp-content/uploads/2020/01/Logo-v4.svg"><br/>
</p>

# #Deprecated
[Please use the new version](https://github.com/competitionlabs/gamification-ux-package)

# Widgets

HTML/CSS and Vanilla JavaScript Competition Labs widgets

## Examples
[Examples Index](https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/index.html)
- [Leaderboard V3 example - Click here](https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/examples/leaderboard_v3.html)
- [Basic Leaderboard example - Click here](https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/examples/leaderboard.html)
- [Competition Leaderboard example - Click here](https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/examples/leaderboard-competition.html)
- [Achievement example - Click here](https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/examples/achievements.html)

<table style="border:none;">
    <tr>
        <td>
            <img width="250" src="https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/3.png" />
        </td>
        <td>
            <img width="214" src="https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/2.png" />
        </td>
        <td>
            <img width="250" src="https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_widgets/1.png" />
        </td>
    </tr>
</table>

## Basic Leaderboard
Adding a leaderboard widget to your website
```html
<script type="text/javascript">
	(function(w,d,s,u,o){
		w[o] = ((w[o]) ? w[o] : []);
		w[o].push({
			spaceName: "<space_name>",
			contestId: "<contest_id>",
			apiKey: {
				"X-API-KEY": "<api_key>"
			},
			font: "Helvetica",
			theme: "standardTheme",
			container: ".cl-leaderboard-widget"
		});
		var a=d.createElement(s), m=d.getElementsByTagName(s)[0];
		a.async=1;a.src=u;m.parentNode.insertBefore(a,m);
	})(window,document,'script','https://gateway.competitionlabs.com/assets/javascripts/leaderboard.js', "_clOptions");
</script>
<div class="cl-leaderboard-widget"></div>
```

## Competition Leaderboard
Adding a competition leaderboard widget to your website
```html
<script type="text/javascript">
	(function(w,d,s,u,o){
		w[o] = ((w[o]) ? w[o] : []);
		w[o].push({
			spaceName: "<space_name>",
			competitionId: "<competition_id>",
			apiKey: {
				"X-API-KEY": "<api_key>"
			},
			font: "Helvetica",
			theme: "standardTheme",
			container: ".cl-competition-leaderboard-widget"
		});
		var a=d.createElement(s), m=d.getElementsByTagName(s)[0];
		a.async=1;a.src=u;m.parentNode.insertBefore(a,m);
	})(window,document,'script','https://gateway.competitionlabs.com/assets/javascripts/competition-leaderboard.js', "_clCompOptions");
</script>
<div class="cl-competition-leaderboard-widget"></div>
```

## SSE Messaging
SSE messaging widget - connects to a SSE channel and handles responses as JSON
```javascript
var messageQueue = [];
new sseMessaging({
    sseUrl: "/api/<your_space>/sse",
    messageInterval: 100,
    callback: function( json ){
        var check = true;
        
        mapObject(messageQueue, function(jObj){
            if( typeof jObj.data !== "undefined" && typeof json.data !== "undefined"
                && typeof jObj.data.message !== "undefined" && typeof json.data.message !== "undefined"
                && jObj.data.message === json.data.message )
            {
                check = false;
            }
        });
        
        if( check ) {
            messageQueue.push(json);
        }
    },
    debug: true
});

/**
 * parse messageQueue every second to avoid multiple similar/same messages or 
 * massive load of messages due to high activity
 */
setInterval(function(){
    try {
        if ( messageQueue.length > 0 ) {
            var data = messageQueue[0];
            
            var index = messageQueue.indexOf(data);
            if (index > -1) {
                messageQueue.splice(index, 1);
            }
            
            if (typeof data.errors !== "undefined" && data.errors.length > 0) {
                console.log(data.errors.join("; "));
            } else {
                console.log(data);
            }
        }
    }catch(e){
        console.log(e, messageQueue);
        messageQueue = []; // clearing message queue of incorrect/corrupt message entries
    }
}, 1000);
```
