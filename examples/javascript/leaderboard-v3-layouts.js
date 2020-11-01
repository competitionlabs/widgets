(function(){
	const stringContains = function (str, partial) {
		return (str.indexOf(partial) > -1);
	};

	var theme = "default-theme";
	const urlParams = window.location.search.split("?");
	var queryMap = {};
	for(var k = 0; k < urlParams.length; k++){
		if( typeof urlParams[k] === "string" && urlParams[k].length > 0 ){
			const terms = urlParams[k].split("=");
			queryMap[terms[0]] = (typeof terms[1] !== "undefined") ? terms[1] : "";
		}
	}


	if ( typeof queryMap.theme !== "undefined" ){
		theme = queryMap.theme;
	}

	const options = {
		autoStart: false,
		uri: {}
	};
	options.enableNotifications = false; // requires a working/valid SSE channel
	options.memberId = "jon-doe-Asd3-_J_CgpY-bw2S2Sy";
	options.uri.gatewayDomain = "";
	options.apiKey = "";
	options.spaceName = "your space";
	options.gameId = "fruits";
	options.bindContainer = document.body;

	// lookup services override
	options.uri.members = "data/member-data-sample.json";
	options.uri.competitions = "data/competition-list-data-sample.json";
	options.uri.competitionById = "data/competition-data-sample.json";
	options.uri.memberCompetitions = "data/competition-list-data-sample.json";
	options.uri.memberCompetitionById = "data/competition-data-sample.json";
	options.uri.contestLeaderboard = "data/leaderboard-data.json";
	options.uri.achievements = "data/achievements-list-data-sample.json";
	options.uri.achievement = "data/achievements-data-sample.json";
	options.uri.achievementsProgression = "data/achievements-list-perc-data-sample.json";
	options.uri.achievementsIssued = "data/achievements-list-issued-data-sample.json";
	options.uri.messages = "data/messages-claimed-data-sample.json";
	options.uri.memberReward = "data/messages-reward-data-sample.json";
	options.uri.messageById = "data/messages-data-sample.json";
	options.uri.assets = "images/:attachmentId.png";
	options.resources = [
		("../leaderboard_v3/build/css/theme/" + theme + ".css?t=" + ( new Date().getTime() ))
	];

	var widgetInstance = new window._clLeaderBoardV3SelfInit( options );
	widgetInstance.loadStylesheet();

	// const miniScoreboard = new widgetInstance.MiniScoreBoard();
	// miniScoreboard.settings.active = true;
	// miniScoreboard.settings.lbWidget = widgetInstance;
	// const miniWrapper = miniScoreboard.layout();
	//
	//
	// const miniHorizontal = document.querySelector(".opt-1-mini-horizontal");
	// const miniHorizontalOpt = document.querySelector(".opt-1-mini-horizontal-opt");
	// miniScoreboard.settings.container = miniHorizontal.appendChild(miniWrapper);
	// miniScoreboard.settings.overlayContainer = miniHorizontal.appendChild(miniScoreboard.overlayLayout());
	// miniScoreboard.settings.infoContainer = conmisio.query(miniScoreboard.settings.container, '.cl-widget-ms-information-wrapper');
	//
	// var miniInstance
	//
	// setInterval(function(){
	// 	if( miniScoreboard.settings.lbWidget.settings.competition.activeCompetition !== null ){
	// 		miniScoreboard.layoutDefaultOrEmpty();
	// 	}
	// }, 3000);
})();
