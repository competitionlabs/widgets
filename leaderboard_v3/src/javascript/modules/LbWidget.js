import moment from 'moment';
import Identicon from 'identicon.js';
import jsSHA from 'jssha';
import cssVars from 'css-vars-ponyfill';

import mergeObjects from '../utils/mergeObjects';
import formatNumberLeadingZeros from '../utils/formatNumberLeadingZeros';
import stringContains from '../utils/stringContains';
import objectIterator from '../utils/objectIterator';
import query from '../utils/query';
import hasClass from '../utils/hasClass';
import addClass from '../utils/addClass';
import removeClass from '../utils/removeClass';
import closest from '../utils/closest';
import isMobileTablet from '../utils/isMobileTablet';
import camelToKebabCase from '../utils/camelToKebabCase';

import cLabs from './cLabs';
import './Ajax';

import { Notifications } from './Notifications';
import { MiniScoreBoard } from './MiniScoreBoard';
import { MainWidget } from './MainWidget';
import { CanvasAnimation } from './CanvasAnimation';

const translation = require(`../../i18n/translation_${process.env.LANG}.json`);

/**
 * Main leaderboard widget, controls all actions and initiation logic.
 * Main responsibility is to control the interactions between different widgets/plugins and user even actions
 * @param options {Object} setting parameters used to overwrite the default settings
 * @constructor
 */
export const LbWidget = function (options) {
  /**
   * LbWidget settings
   * @memberOf LbWidget
   * @constant
   * @type { Object }
   */
  this.settings = {
    debug: true,
    bindContainer: document.body,
    autoStart: true,
    sseMessaging: null,
    notifications: null,
    miniScoreBoard: null,
    canvasAnimation: null,
    enableNotifications: true,
    mainWidget: null,
    globalAjax: new cLabs.Ajax(),
    checkAjax: new cLabs.Ajax(),
    language: process.env.LANG,
    currency: '',
    spaceName: '',
    memberId: '',
    groups: '',
    gameId: '',
    enforceGameLookup: false, // tournament lookup will include/exclude game only requests
    apiKey: '',
    member: null,
    competition: {
      activeCompetitionId: null,
      activeContestId: null,
      activeCompetition: null,
      activeContest: null,
      refreshInterval: null,
      refreshIntervalMillis: 10000,
      extractImageHeader: true // will extract the first found image inside the body tag and move it on top
    },
    achievements: {
      list: [],
      availableRewards: [],
      rewards: [],
      expiredRewards: [],
      extractImageHeader: true // will extract the first found image inside the body tag and move it on top
    },
    rewards: {
      availableRewards: [],
      rewards: [],
      expiredRewards: [],
      rewardFormatter: function (reward) {
        var defaultRewardValue = reward.value;

        if (typeof reward.unitOfMeasure !== 'undefined' && typeof reward.unitOfMeasure.symbol !== 'undefined' && reward.unitOfMeasure.symbol !== null) {
          defaultRewardValue = reward.unitOfMeasure.symbol + reward.value;
        }

        return defaultRewardValue;
      }
    },
    messages: {
      messages: []
    },
    tournaments: {
      activeCompetitionId: null,
      readyCompetitions: [], // statusCode 3
      activeCompetitions: [], // statusCode 5
      finishedCompetitions: [] // statusCode 7
    },
    leaderboard: {
      fullLeaderboardSize: 100,
      refreshIntervalMillis: 3000,
      refreshInterval: null,
      refreshLbDataInterval: null,
      leaderboardData: [],
      loadLeaderboardHistory: {},
      layoutSettings: {
        tournamentList: true,
        imageBanner: false,
        title: true,
        titleLinkToDetailsPage: false // if set to false will make the description available under title
      }
    },
    navigation: { // primary navigation items, if all are disabled init will fail, if only 1 is enabled items will be hidden
      tournaments: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-lb',
        containerClass: 'cl-main-widget-lb'
      },
      achievements: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-ach',
        containerClass: 'cl-main-widget-section-ach'
      },
      rewards: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-rewards',
        containerClass: 'cl-main-widget-section-reward'
      },
      inbox: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-inbox',
        containerClass: 'cl-main-widget-section-inbox'
      }
    },
    uri: {
      gatewayDomain: cLabs.api.url,

      members: '/api/v1/:space/members/reference/:id',
      assets: '/assets/attachments/:attachmentId',

      memberSSE: '/api/v1/:space/sse/reference/:id',
      memberSSEHeartbeat: '/api/v1/:space/sse/reference/:id/heartbeat',

      competitions: '/api/v1/:space/competitions',
      competitionById: '/api/v1/:space/competitions/:id',
      contestLeaderboard: '/api/v1/:space/contests/:id/leaderboard',

      achievement: '/api/v1/:space/achievements/:id',
      achievements: '/api/v1/:space/achievements/members/reference/:id',
      // achievements: "/api/v1/:space/achievements",
      achievementsProgression: '/api/v1/:space/members/reference/:id/achievements',
      achievementsIssued: '/api/v1/:space/members/reference/:id/achievements/issued',

      messages: '/api/v1/:space/members/reference/:id/messages',
      messageById: '/api/v1/:space/members/reference/:id/messages/:messageId',

      memberReward: '/api/v1/:space/members/reference/:id/award/:awardId',
      memberRewardClaim: '/api/v1/:space/members/reference/:id/award/:awardId/award',

      memberCompetitions: '/api/v1/:space/members/reference/:id/competitions',
      memberCompetitionById: '/api/v1/:space/members/reference/:id/competition/:competitionId',
      memberCompetitionOptIn: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin',
      memberCompetitionOptInCheck: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin-check',

      translationPath: '' // ../i18n/translation_:language.json
    },
    loadTranslations: true,
    translation: translation,
    resources: [
      (cLabs.api.url + '/assets/widgets/leaderboard_v3/css/style.css?t=' + (new Date().getTime())),
      (cLabs.api.url + '/assets/widgets/leaderboard_v3/css/fonts.css?t=' + (new Date().getTime()))
    ],
    styles: {},
    layoutBuildCallback: function (layout, instance) {
    }
  };

  if (typeof options !== 'undefined') {
    this.settings = mergeObjects(this.settings, options);
  }

  this.log = function (message) {
    if (this.settings.debug) {
      console.error(message);
    }
  };

  /**
   * Format duration of Date Time from moment() object
   * @memberOf LbWidget
   * @param duration {moment}
   * @returns {string}
   */
  this.formatDateTime = function (duration) {
    var _this = this;
    var largeResult = [];
    var result = [];
    if (duration.days()) largeResult.push(duration.days() + '<span class="time-ind">' + _this.settings.translation.time.days + '</span>');
    if (duration.hours() || duration.days() > 0) {
      result.push(formatNumberLeadingZeros(duration.hours(), 2) + '<span class="time-ind">' + _this.settings.translation.time.hours + '</span>');
    } else result.push('00<span class="time-ind">' + _this.settings.translation.time.hours + '</span>');
    if (duration.minutes() || duration.hours() > 0 || duration.days() > 0) {
      result.push(formatNumberLeadingZeros(duration.minutes(), 2) + ((duration.days() > 0) ? '<span class="time-ind">' + _this.settings.translation.time.minutes + '</span>' : '<span class="time-ind">' + _this.settings.translation.time.minutesShortHand + '</span>'));
    } else (result.push('00' + ((duration.days() > 0) ? '<span class="time-ind">' + _this.settings.translation.time.minutes + '</span>' : '<span class="time-ind">' + _this.settings.translation.time.minutesShortHand + '</span>')));
    // if (duration.seconds() && duration.days() === 0){ result.push( formatNumberLeadingZeros(duration.seconds(), 2) + '<span class="time-ind">s</span>' ) }else if(duration.days() === 0){result.push( '00<span class="time-ind">s</span>' )};
    result.push(formatNumberLeadingZeros(duration.seconds(), 2) + '<span class="time-ind">' + _this.settings.translation.time.seconds + '</span>');
    return (largeResult.length > 0) ? (largeResult.join(' ') + ' ' + result.join(':')) : result.join(':');
  };

  this.populateIdenticonBase64Image = function (str) {
    if (str.length > 0) {
      /* eslint new-cap: "off" */
      var shaObj = new jsSHA('SHA-512', 'TEXT');
      shaObj.update(str);
      var hash = shaObj.getHash('HEX', 1);
      var data = new Identicon(hash, {
        background: [255, 255, 255, 255], // rgba white
        margin: 0.1, // 20% margin
        size: 22, // 420px square
        format: 'svg' // use SVG instead of PNG
      }).toString();

      var icon = 'data:image/svg+xml;base64,' + data;

      return icon;
    } else {
      return '';
    }
  };

  /**
   * get a list of available competition filtered by provided global criteria
   * @param callback {Function}
   */
  const competitionCheckAjax = new cLabs.Ajax();

  this.checkForAvailableCompetitions = function (callback, ajaxInstance) {
    var _this = this;
    var url = (_this.settings.memberId.length === 0) ? (
      _this.settings.uri.competitions.replace(':space', _this.settings.spaceName)
    ) : (
      _this.settings.uri.memberCompetitions.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId)
    );
    var filters = [
      'statusCode>==3',
      'statusCode<==5',
      '_sortByFields=options.scheduledDates.end:desc',
      ('_lang=' + _this.settings.language)
    ];
    var ajaxInstanceToUse = (typeof ajaxInstance !== 'undefined' && ajaxInstance !== null) ? ajaxInstance : competitionCheckAjax;

    if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
      filters.push('_uomKey=' + _this.settings.currency);
    }

    if (_this.settings.gameId.length > 0 && _this.settings.enforceGameLookup) {
      filters.push('options.products.productRefId=' + _this.settings.gameId);
    }

    if (_this.settings.groups.length > 0 && _this.settings.memberId.length === 0) {
      filters.push('options.limitEntrantsTo=' + _this.settings.groups);
    }

    ajaxInstanceToUse.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?' + filters.join('&'),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          _this.settings.tournaments.readyCompetitions = [];
          _this.settings.tournaments.activeCompetitions = [];

          window.mapObject(json.data, function (comp) {
            if (comp.statusCode === 3) {
              _this.settings.tournaments.readyCompetitions.push(comp);
            } else if (comp.statusCode === 5) {
              _this.settings.tournaments.activeCompetitions.push(comp);
            }
          });

          _this.checkForFinishedCompetitions(callback, ajaxInstance);
        } else {
          _this.log('failed to checkForActiveCompetitions ' + response);
        }
      }
    });
  };

  /**
   * get a list of finished competition filtered by provided global criteria
   * @param callback {Function}
   */
  const competitionFinishedCheckAjax = new cLabs.Ajax();

  this.checkForFinishedCompetitions = function (callback, ajaxInstance) {
    var _this = this;
    var url = (_this.settings.memberId.length === 0) ? (
      _this.settings.uri.competitions.replace(':space', _this.settings.spaceName)
    ) : (
      _this.settings.uri.memberCompetitions.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId)
    );
    var filters = [
      'statusCode=7',
      '_limit=10',
      '_sortByFields=options.scheduledDates.end:desc',
      ('_lang=' + _this.settings.language)
    ];
    var ajaxInstanceToUse = (typeof ajaxInstance !== 'undefined' && ajaxInstance !== null) ? ajaxInstance : competitionFinishedCheckAjax;

    if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
      filters.push('_uomKey=' + _this.settings.currency);
    }

    if (_this.settings.gameId.length > 0 && _this.settings.enforceGameLookup) {
      filters.push('options.products.productRefId=' + _this.settings.gameId);
    }

    if (_this.settings.groups.length > 0 && _this.settings.memberId.length === 0) {
      filters.push('options.limitEntrantsTo=' + _this.settings.groups);
    }

    ajaxInstanceToUse.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?' + filters.join('&'),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          _this.settings.tournaments.finishedCompetitions = [];

          window.mapObject(json.data, function (comp) {
            if (comp.statusCode === 7) {
              _this.settings.tournaments.finishedCompetitions.push(comp);
            }
          });

          if (typeof callback === 'function') {
            callback();
          }
        } else {
          _this.log('failed to checkForActiveCompetitions ' + response);
        }
      }
    });
  };

  this.prepareActiveCompetition = function (callback) {
    var _this = this;
    var activeCompetition = null;
    var activeCompetitionId = null;

    if (_this.settings.tournaments.activeCompetitionId !== null) {
      window.mapObject(_this.settings.tournaments.activeCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      window.mapObject(_this.settings.tournaments.readyCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      window.mapObject(_this.settings.tournaments.finishedCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });

      if (activeCompetition !== null) {
        activeCompetitionId = _this.settings.tournaments.activeCompetitionId;
      } else {
        _this.settings.tournaments.activeCompetitionId = null;
      }
    }

    if (activeCompetition === null && _this.settings.tournaments.activeCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.activeCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    } else if (activeCompetition === null && _this.settings.tournaments.readyCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.readyCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    }

    if (activeCompetitionId === null) { // no active or ready competitions found
      _this.deactivateCompetitionsAndLeaderboards();
    } else {
      if (_this.settings.competition.activeCompetitionId !== activeCompetitionId && activeCompetitionId !== null) {
        _this.settings.competition.activeCompetition = activeCompetition;
        _this.settings.competition.activeCompetitionId = activeCompetitionId;
      }

      if (activeCompetitionId !== null) {
        _this.loadActiveCompetition(function (json) {
          _this.setActiveCompetition(json, callback);
        });
      } else if (typeof callback === 'function') {
        callback();
      }
    }
  };

  this.loadActiveCompetition = function (callback) {
    var _this = this;
    var url = (_this.settings.memberId.length === 0) ? (
      _this.settings.uri.competitionById.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.competition.activeCompetitionId)
    ) : (
      _this.settings.uri.memberCompetitionById.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId)
    );
    var filters = [
      ('_include=strategy'),
      ('_lang=' + _this.settings.language)
    ];

    if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
      filters.push('_uomKey=' + _this.settings.currency);
    }

    _this.settings.globalAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?' + filters.join('&'),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          if (typeof callback === 'function') {
            callback(json);
          }
        } else {
          _this.log('failed to loadActiveCompetition ' + response);
        }
      }
    });
  };

  this.setActiveCompetition = function (json, callback) {
    var _this = this;

    _this.settings.competition.activeCompetition = json.data;
    _this.settings.competition.activeContest = null;
    _this.settings.competition.activeContestId = null;

    if (typeof json.data.contests !== 'undefined' && json.data.contests.length > 0) {
      window.mapObject(json.data.contests, function (contest) {
        if (contest.statusCode < 7 && _this.settings.competition.activeContest === null) {
          _this.settings.competition.activeContest = contest;
          _this.settings.competition.activeContestId = contest.id;

          if (typeof _this.settings.competition.activeContest.rewards === 'undefined') {
            _this.settings.competition.activeContest.rewards = [];
          }

          var rewards = [];
          window.mapObject(_this.settings.competition.activeContest.rewards, function (reward) {
            if (typeof reward.rewardRank === 'string') {
              var rankParts = reward.rewardRank.split(',');
              var rewardRank = [];

              window.mapObject(rankParts, function (part) {
                if (stringContains(part, '-')) {
                  var rankRange = part.split('-');
                  var rageStart = parseInt(rankRange[0]);
                  var rangeEnd = parseInt(rankRange[1]);
                  for (var i = rageStart; i <= rangeEnd; i++) {
                    rewardRank.push(i);
                  }
                } else {
                  rewardRank.push(parseInt(part));
                }
              });

              reward.rewardRank = rewardRank;
            }

            rewards.push(reward);
          });

          _this.settings.competition.activeContest.rewards = rewards;
        }
      });
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.getLeaderboardData = function (count, callback) {
    if (this.settings.competition.activeContestId !== null) {
      var _this = this;
      var url = _this.settings.uri.contestLeaderboard.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.competition.activeContestId);
      var filters = [
        '_limit=' + count,
        'rankings=2'
      ];

      if (typeof _this.settings.memberId === 'string' && _this.settings.memberId.length > 0) {
        filters.push('memberId=' + _this.settings.memberId);
      }

      _this.settings.globalAjax.abort().getData({
        type: 'GET',
        url: _this.settings.uri.gatewayDomain + url + '?' + filters.join('&'),
        headers: {
          'X-API-KEY': _this.settings.apiKey
        },
        success: function (response, dataObj, xhr) {
          if (xhr.status === 200) {
            var json = JSON.parse(response);

            // if(
            //   typeof _this.settings.loadLeaderboardHistory[_this.settings.competition.activeContestId] === "undefined"
            //   ||
            //   (
            //     typeof _this.settings.loadLeaderboardHistory[_this.settings.competition.activeContestId] !== "undefined"
            //     &&
            //     _this.settings.loadLeaderboardHistory[_this.settings.competition.activeContestId] !== data
            //   )
            // ) {
            //   _this.settings.loadLeaderboardHistory[_this.settings.competition.activeContestId] = {
            //     changed: true,
            //     data: JSON.stringify(json.data)
            //   };
            // }

            _this.settings.leaderboard.leaderboardData = json.data;

            callback(json.data);
          } else {
            _this.log('failed to getLeaderboardData ' + response);
          }
        }
      });
    } else {
      callback();
    }
  };

  var checkAchievementsAjax = new cLabs.Ajax();
  this.checkForAvailableAchievements = function (callback) {
    var _this = this;
    var url = _this.settings.uri.achievements.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);
    var filters = [
      '_limit=100',
      '_include=rewards',
      ('_lang=' + _this.settings.language)
    ];
    var withGroups = false;

    if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
      filters.push('_uomKey=' + _this.settings.currency);
    }

    if (typeof _this.settings.member.groups !== 'undefined' && _this.settings.member.groups.length > 0) {
      withGroups = true;
      filters.push('memberGroups=' + _this.settings.member.groups.join(','));
    }

    checkAchievementsAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?_lang=' + _this.settings.language + '&_uomKey=' + _this.settings.currency,
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var jsonForAll = JSON.parse(response);

          _this.settings.achievements.list = [];

          window.mapObject(jsonForAll.data, function (ach) {
            _this.settings.achievements.list.push(ach);
          });

          if (withGroups) {
            checkAchievementsAjax.abort().getData({
              type: 'GET',
              url: _this.settings.uri.gatewayDomain + url + '?' + filters.join('&'),
              headers: {
                'X-API-KEY': _this.settings.apiKey
              },
              success: function (response, dataObj, xhr) {
                if (xhr.status === 200) {
                  var json = JSON.parse(response);

                  window.mapObject(json.data, function (ach) {
                    _this.settings.achievements.list.push(ach);
                  });

                  if (typeof callback === 'function') callback(_this.settings.achievements.list);
                } else {
                  _this.log('failed to checkForAvailableAchievements ' + response);
                }
              }
            });
          } else {
            if (typeof callback === 'function') callback(jsonForAll.data);
          }
        } else {
          _this.log('failed to checkForAvailableAchievements ' + response);
        }
      }
    });
  };

  var getAchievementsAjax = new cLabs.Ajax();
  this.getAchievement = function (achievementId, callback) {
    var _this = this;

    getAchievementsAjax.abort().getData({
      url: _this.settings.uri.gatewayDomain + _this.settings.uri.achievement.replace(':space', _this.settings.spaceName).replace(':id', achievementId) + '?_lang=' + _this.settings.language + '&_uomKey=' + _this.settings.currency,
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      type: 'GET',
      success: function (response, dataObj, xhr) {
        var json = null;
        if (xhr.status === 200) {
          try {
            json = JSON.parse(response);
          } catch (e) {
          }
        }

        if (typeof callback === 'function') {
          callback(json);
        }
      },
      error: function () {
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    });
  };

  var getRewardAjax = new cLabs.Ajax();
  this.getReward = function (rewardId, callback) {
    var _this = this;

    getRewardAjax.abort().getData({
      url: _this.settings.uri.gatewayDomain + _this.settings.uri.memberReward.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':awardId', rewardId),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      type: 'GET',
      success: function (response, dataObj, xhr) {
        var json = null;
        if (xhr.status === 200) {
          try {
            json = JSON.parse(response);
          } catch (e) {
          }
        }

        if (typeof callback === 'function') {
          callback(json);
        }
      },
      error: function () {
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    });
  };

  var getMessageAjax = new cLabs.Ajax();
  this.getMessage = function (messageId, callback) {
    var _this = this;

    getMessageAjax.abort().getData({
      url: _this.settings.uri.gatewayDomain + _this.settings.uri.messageById.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':messageId', messageId),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      type: 'GET',
      success: function (response, dataObj, xhr) {
        var json = null;
        if (xhr.status === 200) {
          try {
            json = JSON.parse(response);
          } catch (e) {
          }
        }

        if (typeof callback === 'function') {
          callback(json);
        }
      },
      error: function () {
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    });
  };

  var claimRewardAjax = new cLabs.Ajax();
  this.claimReward = function (rewardId, callback) {
    var _this = this;

    claimRewardAjax.abort().getData({
      url: _this.settings.uri.gatewayDomain + _this.settings.uri.memberRewardClaim.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':awardId', rewardId),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      type: 'POST',
      success: function (response, dataObj, xhr) {
        var json = null;
        if (xhr.status === 200) {
          try {
            json = JSON.parse(response);
          } catch (e) {
          }
        }

        if (typeof callback === 'function') {
          callback(json);
        }
      },
      error: function () {
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    });
  };

  var checkForMemberAchievementsAjax = new cLabs.Ajax();
  this.checkForMemberAchievementsIssued = function (callback) {
    var _this = this;
    var url = _this.settings.uri.achievementsIssued.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);

    checkForMemberAchievementsAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url,
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);
          var idList = [];

          if (typeof json.aggregations !== 'undefined' && json.aggregations.length > 0) {
            window.mapObject(json.aggregations[0].items, function (item) {
              idList.push(item.value);
            });
          }

          if (typeof callback === 'function') callback(idList);
        } else {
          _this.log('failed to checkForMemberAchievementsIssued ' + response);
        }
      }
    });
  };

  var checkForMemberAchievementsProgressionAjax = new cLabs.Ajax();
  this.checkForMemberAchievementsProgression = function (idList, callback) {
    var _this = this;
    var url = _this.settings.uri.achievementsProgression.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);

    checkForMemberAchievementsProgressionAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + (idList.length > 0 ? ('?id=' + idList.join(',')) : ''),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          if (typeof callback === 'function') callback(json.data);
        } else {
          _this.log('failed to checkForMemberAchievementsProgression ' + response);
        }
      }
    });
  };

  var checkForAvailableRewardsAjax = new cLabs.Ajax();
  this.checkForAvailableRewards = function (callback) {
    var _this = this;
    var url = _this.settings.uri.messages.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);

    // claimed rewards
    checkForAvailableRewardsAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?_sortByFields=created:desc&messageType=Reward&prize.claimed=true&_hasValuesFor=prize&_limit=100',
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var jsonForAll = JSON.parse(response);

          _this.settings.rewards.rewards = [];
          _this.settings.rewards.availableRewards = [];
          _this.settings.rewards.expiredRewards = [];

          window.mapObject(jsonForAll.data, function (message) {
            var expired = (typeof message.expiry === 'undefined') ? false : (moment(message.expiry).diff(moment()) < 0);

            if (!expired) {
              _this.settings.rewards.rewards.push(message);
            }
          });

          // not-claimed rewards
          checkForAvailableRewardsAjax.abort().getData({
            type: 'GET',
            url: _this.settings.uri.gatewayDomain + url + '?_sortByFields=created:desc&messageType=Reward&prize.claimed=false&_hasValuesFor=prize&_limit=100',
            headers: {
              'X-API-KEY': _this.settings.apiKey
            },
            success: function (response, dataObj, xhr) {
              if (xhr.status === 200) {
                var jsonForAll = JSON.parse(response);

                window.mapObject(jsonForAll.data, function (message) {
                  var expired = (typeof message.expiry === 'undefined') ? false : (moment(message.expiry).diff(moment()) < 0);

                  if (!expired) {
                    _this.settings.rewards.availableRewards.push(message);
                  }
                });

                // expired rewards
                var date = new Date();
                var utcDate = date.getUTCFullYear() + '-' + formatNumberLeadingZeros((date.getUTCMonth() + 1), 2) + '-' + formatNumberLeadingZeros(date.getUTCDate(), 2) + 'T' + formatNumberLeadingZeros(date.getUTCHours(), 2) + ':' + formatNumberLeadingZeros(date.getUTCMinutes(), 2) + ':00';
                _this.settings.globalAjax.abort().getData({
                  type: 'GET',
                  url: _this.settings.uri.gatewayDomain + url + '?_sortByFields=created:desc&_limit=100&messageType=Reward&_hasValuesFor=expiry&expiry<==' + utcDate,
                  headers: {
                    'X-API-KEY': _this.settings.apiKey
                  },
                  success: function (response, dataObj, xhr) {
                    if (xhr.status === 200) {
                      var jsonForAll = JSON.parse(response);

                      window.mapObject(jsonForAll.data, function (message) {
                        _this.settings.rewards.expiredRewards.push(message);
                      });

                      if (typeof callback === 'function') callback(_this.settings.rewards.rewards, _this.settings.rewards.availableRewards, _this.settings.rewards.expiredRewards);
                    } else {
                      _this.log('failed to checkForAvailableRewards expired ' + response);
                    }
                  }
                });
              } else {
                _this.log('failed to checkForAvailableRewards not-claimed ' + response);
              }
            }
          });
        } else {
          _this.log('failed to checkForAvailableRewards claimed ' + response);
        }
      }
    });
  };

  var checkForAvailableMessagesAjax = new cLabs.Ajax();
  this.checkForAvailableMessages = function (callback) {
    var _this = this;
    var url = _this.settings.uri.messages.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);
    var date = new Date();

    date.setDate(date.getMonth() - 1);

    var createdDateFilter = date.getFullYear() + '-' + formatNumberLeadingZeros((date.getMonth() + 1), 2) + '-' + formatNumberLeadingZeros(date.getDate(), 2);

    checkForAvailableMessagesAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + '?_sortByFields=created:desc&_hasNoValuesFor=prize&_limit=100&created>==' + createdDateFilter,
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var jsonForAll = JSON.parse(response);

          _this.settings.messages.messages = [];

          window.mapObject(jsonForAll.data, function (message) {
            _this.settings.messages.messages.push(message);
          });

          if (typeof callback === 'function') callback(_this.settings.messages.messages);
        } else {
          _this.log('failed to checkForAvailableMessages ' + response);
        }
      }
    });
  };

  var optInMemberAjax = new cLabs.Ajax();
  this.optInMemberToActiveCompetition = function (callback) {
    var _this = this;
    var url = _this.settings.uri.memberCompetitionOptIn.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId);

    optInMemberAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url,
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          callback();
        } else {
          _this.log('failed to optInMemberToActiveCompetition ' + response);
        }
      }
    });
  };

  var revalidationCount = 0;
  this.revalidateIfSuccessfullOptIn = function (callback) {
    var _this = this;

    _this.loadActiveCompetition(function (competitionJson) {
      if (typeof competitionJson.data.optin === 'boolean' && !competitionJson.data.optin) {
        revalidationCount++;

        if (revalidationCount < 5) {
          setTimeout(function () {
            _this.revalidateIfSuccessfullOptIn(callback);
          }, 100);
        } else {
          revalidationCount = 0;
        }
      } else if (typeof competitionJson.data.optin === 'boolean' && competitionJson.data.optin) {
        callback(competitionJson);
      }
    });
  };

  this.leaderboardDataRefresh = function () {
    var _this = this;

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (
      (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optinRequired === 'boolean' && !_this.settings.competition.activeCompetition.optinRequired) ||
      (typeof _this.settings.competition.activeCompetition.optin === 'boolean' && _this.settings.competition.activeCompetition.optin)
    ) {
      var count = (_this.settings.miniScoreBoard.settings.active) ? 0 : _this.settings.leaderboard.fullLeaderboardSize;
      _this.getLeaderboardData(count, function (data) {
        if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
        if (_this.settings.mainWidget.settings.active) _this.settings.mainWidget.loadLeaderboard();
      });
    }

    _this.settings.leaderboard.refreshLbDataInterval = setTimeout(function () {
      _this.leaderboardDataRefresh();
    }, _this.settings.leaderboard.refreshIntervalMillis);
  };

  this.activeCompetitionDataRefresh = function (callback) {
    var _this = this;

    if (_this.settings.competition.refreshInterval) {
      clearTimeout(_this.settings.competition.refreshInterval);
    }

    _this.checkForAvailableCompetitions(function () {
      _this.prepareActiveCompetition(function () {
        var count = (_this.settings.miniScoreBoard.settings.active) ? 0 : _this.settings.leaderboard.fullLeaderboardSize;

        // clear to not clash with LB refresh that could happen at same time
        if (_this.settings.leaderboard.refreshInterval) {
          clearTimeout(_this.settings.leaderboard.refreshInterval);
        }

        if (_this.settings.miniScoreBoard.settings.active || _this.settings.mainWidget.settings.active) {
          if (
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optinRequired === 'boolean' && !_this.settings.competition.activeCompetition.optinRequired) ||
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optin === 'boolean' && _this.settings.competition.activeCompetition.optin)
          ) {
            _this.getLeaderboardData(count, function (data) {
              if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
              if (_this.settings.mainWidget.settings.active) _this.settings.mainWidget.loadLeaderboard();

              // re-start leaderboard refresh
              _this.leaderboardDataRefresh();

              if (typeof callback === 'function') {
                callback();
              }
            });
          } else {
            if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
            if (_this.settings.mainWidget.settings.active) {
              _this.getLeaderboardData(count, function (data) {
                _this.settings.mainWidget.loadLeaderboard();
              });
            }

            // restart leaderboard refresh
            _this.leaderboardDataRefresh();

            if (typeof callback === 'function') {
              callback();
            }
          }
        } else {
          if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();

          if (typeof callback === 'function') {
            callback();
          }
        }
      });
    });

    _this.settings.competition.refreshInterval = setTimeout(function () {
      _this.activeCompetitionDataRefresh();
    }, _this.settings.competition.refreshIntervalMillis);
  };

  this.deactivateCompetitionsAndLeaderboards = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
    }

    _this.settings.miniScoreBoard.clearAll();
    _this.settings.mainWidget.clearAll();

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.stopActivity = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
      clearInterval(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (_this.settings.miniScoreBoard.settings.updateInterval) {
      clearTimeout(_this.settings.miniScoreBoard.settings.updateInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.restartActivity = function (callback) {
    var _this = this;

    _this.activeCompetitionDataRefresh();
    _this.settings.miniScoreBoard.updateScoreBoard();

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.loadMember = function (callback) {
    var _this = this;

    _this.settings.globalAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + _this.settings.uri.members.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          _this.settings.member = json.data;

          callback(json.data);
        } else {
          _this.log('failed to loadMember ' + response);
        }
      }
    });
  };

  this.loadWidgetTranslations = function (callback) {
    var _this = this;

    if (typeof _this.settings.uri.translationPath === 'string' && _this.settings.uri.translationPath.length > 0 && _this.settings.loadTranslations) {
      _this.settings.globalAjax.abort().getData({
        type: 'GET',
        url: _this.settings.uri.gatewayDomain + _this.settings.uri.translationPath.replace(':language', _this.settings.language),
        headers: {
          'X-API-KEY': _this.settings.apiKey
        },
        success: function (response, dataObj, xhr) {
          if (xhr.status === 200) {
            var json = JSON.parse(response);

            _this.settings.translation = mergeObjects(_this.settings.translation, json);

            callback();
          } else {
            _this.log('no translation foound ' + response);

            callback();
          }
        }
      });
    } else {
      callback();
    }
  };

  this.startup = function () {
    var _this = this;

    _this.settings.miniScoreBoard.initLayout(function () {
      _this.settings.miniScoreBoard.settings.active = true;
      _this.activeCompetitionDataRefresh();

      if (_this.settings.enableNotifications) {
        _this.settings.notifications.init();
      }

      _this.cleanup();
    });
  };

  var _cleanupInstance;
  this.cleanup = function () {
    var _this = this;

    if (_cleanupInstance) {
      clearTimeout(_cleanupInstance);
    }

    _cleanupInstance = setTimeout(function () {
      _this.settings.mainWidget.preLoaderRerun();

      _this.cleanup();
    }, 3000);
  };

  this.loadStylesheet = function (callback) {
    var _this = this;
    var createdResources = false;
    var availableLinks = [];

    objectIterator(query('link'), function (link) {
      if (link !== null) {
        availableLinks.push(link.href);
      }
    });

    window.mapObject(_this.settings.resources, function (resource, key, count) {
      var exists = false;

      window.mapObject(availableLinks, function (link) {
        if (link === resource) {
          exists = true;
        }
      });

      if (!exists) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', resource);

        if (count === 0) {
          link.onload = function () {
            if (typeof callback === 'function') {
              callback();
            }
          };

          link.onerror = function (e) {
            if (typeof callback === 'function') {
              callback();
            }
          };
        }

        document.body.appendChild(link);

        createdResources = true;
      }
    });

    if (!createdResources && typeof callback === 'function') {
      callback();
    }
  };

  this.clickedMiniScoreBoard = function () {
    var _this = this;

    if (!_this.settings.miniScoreBoard.settings.dragging) {
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.leaderboard.leaderboardData = [];
        _this.settings.mainWidget.initLayout(function () {
          _this.activeCompetitionDataRefresh();
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  /**
   * Open main widget and open specific tab and loads relevant action
   * @memberOf LbWidget
   * @param tab String
   * @param actionCallback Function
   */
  this.openWithTabAndAction = function (tab, actionCallback) {
    var _this = this;

    if (_this.settings.mainWidget.settings.active) {
      var loadTab = query(_this.settings.mainWidget.settings.container, tab);
      _this.settings.mainWidget.navigationSwitch(loadTab, function () {
        _this.activeCompetitionDataRefresh();

        if (typeof actionCallback === 'function') {
          actionCallback();
        }
      });

      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    } else {
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.mainWidget.initLayout(function () {
          _this.settings.mainWidget.navigationSwitch(query(_this.settings.mainWidget.settings.container, tab), function () {
            _this.activeCompetitionDataRefresh();

            if (typeof actionCallback === 'function') {
              actionCallback();
            }
          });
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  var loadCompetitionListAjax = new cLabs.Ajax();
  this.eventHandlers = function (el) {
    var _this = this;

    // mini scoreboard opt-in action
    if (hasClass(el, 'cl-widget-ms-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      _this.optInMemberToActiveCompetition(function () {
        _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
          _this.settings.competition.activeCompetition = competitionJson.data;

          // _this.getLeaderboardData(1, function( data ){
          //  _this.settings.miniScoreBoard.loadScoreBoard( data );
          // });

          // extra action to load competition details on mini scoreboard opt-in - Product request
          _this.deactivateCompetitionsAndLeaderboards(function () {
            _this.settings.leaderboard.leaderboardData = [];
            _this.settings.mainWidget.initLayout(function () {
              _this.activeCompetitionDataRefresh();

              _this.settings.mainWidget.loadCompetitionDetails(function () {

              });
            });
            setTimeout(function () {
              _this.settings.miniScoreBoard.settings.container.style.display = 'none';
            }, 200);
          });

          removeClass(el, 'checking');
        });
      });

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-details-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      _this.optInMemberToActiveCompetition(function () {
        _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
          _this.settings.competition.activeCompetition = competitionJson.data;
          _this.settings.mainWidget.competitionDetailsOptInButtonState();

          removeClass(el, 'checking');
        });
      });

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      _this.optInMemberToActiveCompetition(function () {
        _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
          _this.settings.competition.activeCompetition = competitionJson.data;

          _this.settings.mainWidget.loadCompetitionDetails(function () {
          });

          removeClass(el, 'checking');
          el.parentNode.style.display = 'none';
        });
      });

      // close mini scoreboard info area
    } else if (hasClass(el, 'cl-widget-ms-information-close') && !hasClass(el, 'checking')) {
      _this.settings.miniScoreBoard.clearAll();

      // close notification window
    } else if (hasClass(el, 'cl-widget-notif-information-close') && !hasClass(el, 'checking')) {
      _this.settings.notifications.hideNotification();

      // close leaderboard window
    } else if (hasClass(el, 'cl-main-widget-lb-header-close') || hasClass(el, 'cl-main-widget-ach-header-close') || hasClass(el, 'cl-main-widget-reward-header-close') || hasClass(el, 'cl-main-widget-inbox-header-close')) {
      _this.settings.mainWidget.hide(function () {
        _this.settings.miniScoreBoard.settings.active = true;
        _this.settings.miniScoreBoard.settings.container.style.display = 'block';

        _this.activeCompetitionDataRefresh();
      });

      // load embedded competition details
    } else if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage && hasClass(el, 'cl-main-widget-lb-details-content-label')) {
      _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () {});

      // hide embedded competition details
    } else if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage && hasClass(el, 'cl-main-widget-lb-details-description-close')) {
      _this.settings.mainWidget.hideEmbeddedCompetitionDetailsContent(function () {});

      // load competition details
    } else if (hasClass(el, 'cl-main-widget-lb-details-content-label')) {
      if (_this.settings.competition.activeContest !== null) {
        _this.settings.mainWidget.loadCompetitionDetails(function () {
        });
      }

      // load achievement details
    } else if (hasClass(el, 'cl-ach-list-more')) {
      _this.getAchievement(el.dataset.id, function (data) {
        _this.settings.mainWidget.loadAchievementDetails(data, function () {
        });
      });

      // leaderboard details back button
    } else if (hasClass(el, 'cl-main-widget-lb-details-back-btn')) {
      _this.settings.mainWidget.hideCompetitionDetails();

      // achievements details back button
    } else if (hasClass(el, 'cl-main-widget-ach-details-back-btn')) {
      _this.settings.mainWidget.hideAchievementDetails(function () {
      });

      // rewards details back button
    } else if (hasClass(el, 'cl-main-widget-reward-details-back-btn')) {
      _this.settings.mainWidget.hideRewardDetails(function () {
      });

      // messages details back button
    } else if (hasClass(el, 'cl-main-widget-inbox-details-back-btn')) {
      _this.settings.mainWidget.hideMessageDetails(function () {
      });

      // load rewards details
    } else if (hasClass(el, 'cl-rew-list-item') || closest(el, '.cl-rew-list-item') !== null) {
      var rewardId = (hasClass(el, 'cl-rew-list-item')) ? el.dataset.rewardId : closest(el, '.cl-rew-list-item').dataset.rewardId;
      _this.getReward(rewardId, function (data) {
        _this.settings.mainWidget.loadRewardDetails(data, function () {
        });
      });

      // load inbox details
    } else if (hasClass(el, 'cl-inbox-list-item') || closest(el, '.cl-inbox-list-item') !== null) {
      var messageId = (hasClass(el, 'cl-inbox-list-item')) ? el.dataset.rewardId : closest(el, '.cl-inbox-list-item').dataset.id;
      _this.getMessage(messageId, function (data) {
        _this.settings.mainWidget.loadMessageDetails(data, function () {
        });
      });

      // claim reward
    } else if (hasClass(el, 'cl-main-widget-reward-claim-btn')) {
      _this.claimReward(el.dataset.id, function (data) {
        if (data.data.claimed) {
          _this.settings.mainWidget.loadRewards();

          addClass(el, 'cl-claimed');
          el.innerHTML = _this.settings.translation.rewards.claimed;
        } else {
          removeClass(el, 'cl-claimed');
          el.innerHTML = _this.settings.translation.rewards.claim;
        }
      });

      // load achievement details window from notification window
    } else if (hasClass(el, 'cl-widget-notif-information-details-wrapper') || closest(el, '.cl-widget-notif-information-details-wrapper') !== null) {
      _this.openWithTabAndAction('.cl-main-widget-navigation-ach-icon', function () {
        var id = (hasClass(el, 'cl-widget-notif-information-details-wrapper')) ? el.dataset.id : closest(el, '.cl-widget-notif-information-details-wrapper').dataset.id;
        _this.settings.notifications.hideNotification();
        _this.settings.mainWidget.hideAchievementDetails(function () {
          _this.getAchievement(id, function (data) {
            _this.settings.mainWidget.loadAchievementDetails(data);
          });
        });
      });

      // primary widget navigation
    } else if (hasClass(el, 'cl-main-navigation-item')) {
      _this.settings.mainWidget.navigationSwitch(el);

      // competition list
    } else if (hasClass(el, 'cl-main-widget-lb-header-list-icon')) {
      if (_this.settings.leaderboard.refreshInterval) {
        clearTimeout(_this.settings.leaderboard.refreshInterval);
      }
      _this.settings.mainWidget.loadCompetitionList(function () {
        _this.activeCompetitionDataRefresh();
      }, loadCompetitionListAjax);

      // load competition
    } else if (hasClass(el, 'cl-tour-list-item') || closest(el, '.cl-tour-list-item') !== null) {
      var tournamentId = (hasClass(el, 'cl-tour-list-item')) ? el.dataset.id : closest(el, '.cl-tour-list-item').dataset.id;
      var preLoader = _this.settings.mainWidget.preloader();

      preLoader.show(function () {
        _this.settings.mainWidget.settings.active = true;
        _this.settings.tournaments.activeCompetitionId = tournamentId;
        _this.activeCompetitionDataRefresh(function () {
          _this.settings.mainWidget.hideCompetitionList(function () {
            preLoader.hide();
          });
        });
      });

      // hide competition list view
    } else if (hasClass(el, 'cl-main-widget-tournaments-back-btn')) {
      _this.settings.mainWidget.hideCompetitionList();

      // mini scoreboard action to open primary widget
    } else if ((hasClass(el, 'cl-widget-ms-icon-wrapper') || closest(el, '.cl-widget-ms-icon-wrapper') !== null) || (hasClass(el, 'cl-widget-ms-information-wrapper') || closest(el, '.cl-widget-ms-information-wrapper') !== null)) {
      _this.clickedMiniScoreBoard();

      // accordion navigation
    } else if (hasClass(el, 'cl-accordion-label')) {
      _this.settings.mainWidget.accordionNavigation(el);
    }
  };

  this.eventListeners = function () {
    var _this = this;

    document.body.addEventListener('keyup', function (event) {
      switch (event.keyCode) {
        case 27: // on escape
          if (_this.settings.mainWidget.settings.active) {
            _this.settings.mainWidget.hide(function () {
              _this.settings.miniScoreBoard.settings.active = true;
              _this.settings.miniScoreBoard.settings.container.style.display = 'block';

              _this.activeCompetitionDataRefresh();
            });
          }
          break;
      }
    });

    if (_this.isMobile()) {
      document.body.addEventListener('touchend', function (event) {
        var el = event.target;

        if (!_this.settings.miniScoreBoard.settings.dragging) {
          _this.eventHandlers(el);
        }
      });
    } else {
      document.body.addEventListener('click', function (event) {
        var el = event.target;

        _this.eventHandlers(el);
      });
    }
  };

  this.closeEverything = function () {
    var _this = this;

    _this.deactivateCompetitionsAndLeaderboards(function () {
      _this.settings.leaderboard.leaderboardData = [];
      _this.settings.mainWidget.initLayout(function () {
        _this.activeCompetitionDataRefresh();
      });
      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    });

    _this.settings.mainWidget.hide();
    _this.settings.mainWidget.settings.preLoader.preLoaderActive = false;
  };

  this.isMobile = function () {
    return isMobileTablet();
  };

  this.applyAppearance = function () {
    if (this.settings.styles) {
      const styles = Object.keys(this.settings.styles).reduce((accumulator, currentValue) => {
        return {
          ...accumulator,
          [`--lb3-${camelToKebabCase(currentValue)}`]: this.settings.styles[currentValue]
        };
      }, {});

      cssVars({
        include: 'link[rel=stylesheet],style',
        watch: true,
        onlyLegacy: false,
        variables: { ...styles }
      });
    }
  };

  /**
   * Init LbWidget method
   * @method
   * @memberOf LbWidget
   * @return {undefined}
   */
  this.init = function () {
    this.loadStylesheet(() => {
      this.applyAppearance();

      this.loadMember((member) => {
        this.loadWidgetTranslations(() => {
          if (this.settings.miniScoreBoard === null) {
            this.settings.canvasAnimation = new CanvasAnimation();
            this.settings.notifications = new Notifications();
            this.settings.miniScoreBoard = new MiniScoreBoard({
              active: true
            });
            this.settings.mainWidget = new MainWidget();

            this.settings.notifications.settings.lbWidget = this;
            this.settings.miniScoreBoard.settings.lbWidget = this;
            this.settings.mainWidget.settings.lbWidget = this;
            this.settings.canvasAnimation.settings.lbWidget = this;

            this.startup();
            this.eventListeners();
          } else {
            this.settings.mainWidget.hide(() => {
              this.deactivateCompetitionsAndLeaderboards(() => {
                this.settings.miniScoreBoard.settings.active = true;
                this.settings.miniScoreBoard.settings.container.style.display = 'block';
                this.startup();
              });
            });
          }
        });
      });
    });
  };

  if (this.settings.autoStart) {
    this.init();
  }
};
