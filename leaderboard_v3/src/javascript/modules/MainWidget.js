import moment from 'moment';
import hasClass from '../utils/hasClass';
import removeClass from '../utils/removeClass';
import objectIterator from '../utils/objectIterator';
import query from '../utils/query';
import closest from '../utils/closest';
import addClass from '../utils/addClass';
import remove from '../utils/remove';
import appendNext from '../utils/appendNext';
import stripHtml from '../utils/stripHtml';

/**
 * MainWidget
 * @param options {Object}
 * @constructor
 */
export const MainWidget = function (options) {
  /**
   * MainWidget settings
   * @memberOf MainWidget
   * @constant
   * @type { Object }
   */
  this.settings = {
    lbWidget: null,
    container: null,
    navigation: null,
    section: null,
    detailsContainer: null,
    tournamentListContainer: null,
    headerDate: null,
    preLoader: {
      preLoaderActive: false,
      preLoaderlastAttempt: null,
      preloaderCallbackRecovery: function () {
      }
    },
    achievement: {
      container: null,
      detailsContainer: null
    },
    reward: {
      container: null,
      detailsContainer: null
    },
    messages: {
      container: null,
      detailsContainer: null
    },
    leaderboard: {
      defaultEmptyList: 20,
      topResultSize: 3,
      header: null,
      container: null,
      list: null,
      topResults: null,
      timerInterval: null
    },
    tournamentsSection: {
      accordionLayout: [{
        label: 'Upcoming Tournaments',
        type: 'readyCompetitions',
        show: false,
        showTopResults: 1
      }, {
        label: 'Active Tournaments',
        type: 'activeCompetitions',
        show: true,
        showTopResults: 1
      }, {
        label: 'Finished Tournaments',
        type: 'finishedCompetitions',
        show: false,
        showTopResults: 1
      }]
    },
    rewardsSection: {
      accordionLayout: [{
        label: 'Available Rewards',
        type: 'availableRewards',
        show: true,
        showTopResults: 1
      }, {
        label: 'Claimed Rewards',
        type: 'rewards',
        show: false,
        showTopResults: 1
      }, {
        label: 'Expired Rewards',
        type: 'expiredRewards',
        show: false,
        showTopResults: 1
      }]
    },
    active: false,
    navigationSwitchLastAtempt: new Date().getTime(),
    navigationSwitchInProgress: false
  };

  if (typeof options !== 'undefined') {
    for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
        this.settings[opt] = options[opt];
      }
    }
  }

  /**
   * Accordion style layout
   * - parameters:
   *      - label: String "Available rewards"
   *      - type: String "available-rewards"
   *      - shown: Boolean true/false
   *
   * @memberOf MainWidget
   * @param data { Array }
   * @param onLayout { Function }
   */
  this.accordionStyle = function (data, onLayout) {
    var _this = this;
    var accordionWrapper = document.createElement('div');

    accordionWrapper.setAttribute('class', 'cl-main-accordion-container');

    window.mapObject(data, function (entry) {
      var accordionSection = document.createElement('div');
      var accordionLabel = document.createElement('div');
      var topShownEntry = document.createElement('div');
      var accordionListContainer = document.createElement('div');
      var accordionList = document.createElement('div');

      accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
      accordionLabel.setAttribute('class', 'cl-accordion-label');
      topShownEntry.setAttribute('class', 'cl-accordion-entry');
      accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
      accordionList.setAttribute('class', 'cl-accordion-list');

      if (typeof _this.settings.lbWidget.settings.translation.rewards[entry.type] !== 'undefined') {
        accordionLabel.innerHTML = _this.settings.lbWidget.settings.translation.rewards[entry.type];
      } else if (typeof _this.settings.lbWidget.settings.translation.tournaments[entry.type] !== 'undefined') {
        accordionLabel.innerHTML = _this.settings.lbWidget.settings.translation.tournaments[entry.type];
      } else {
        accordionLabel.innerHTML = entry.label;
      }

      if (typeof onLayout === 'function') {
        onLayout(accordionSection, accordionList, topShownEntry, entry);
      }

      accordionListContainer.appendChild(accordionList);

      accordionSection.appendChild(accordionLabel);
      accordionSection.appendChild(topShownEntry);
      accordionSection.appendChild(accordionListContainer);

      accordionWrapper.appendChild(accordionSection);
    });

    return accordionWrapper;
  };

  this.accordionNavigation = function (element) {
    // var _this = this;
    var parentEl = element.parentNode;

    if (hasClass(parentEl, 'cl-shown')) {
      removeClass(parentEl, 'cl-shown');
    } else {
      objectIterator(query(closest(parentEl, '.cl-main-accordion-container'), '.cl-shown'), function (obj) {
        removeClass(obj, 'cl-shown');
      });

      addClass(parentEl, 'cl-shown');
    }
  };

  this.layout = function () {
    var _this = this;
    var wrapper = document.createElement('div');
    var innerWrapper = document.createElement('div');

    var navigationContainer = document.createElement('div');
    var navigationItems = document.createElement('div');
    var navigationItemLB = document.createElement('div');
    var navigationItemLBIcon = document.createElement('div');
    var navigationItemACH = document.createElement('div');
    var navigationItemACHIcon = document.createElement('div');
    var navigationItemRewards = document.createElement('div');
    var navigationItemRewardsIcon = document.createElement('div');
    var navigationItemInbox = document.createElement('div');
    var navigationItemInboxIcon = document.createElement('div');

    var mainSectionContainer = document.createElement('div');

    var preLoaderContainer = document.createElement('div');
    var preLoaderContent = document.createElement('div');
    var preLoaderBar1 = document.createElement('div');
    var preLoaderBar2 = document.createElement('div');
    var preLoaderBar3 = document.createElement('div');

    var sectionLB = _this.leaderboardAreaLayout();
    var sectionACH = _this.achievementsAreaLayout();
    var sectionRewards = _this.rewardsAreaLayout();
    var sectionInbox = _this.inboxAreaLayout();

    wrapper.setAttribute('class', 'cl-main-widget-wrapper');
    innerWrapper.setAttribute('class', 'cl-main-widget-inner-wrapper');

    navigationContainer.setAttribute('class', 'cl-main-widget-navigation-container');
    navigationItems.setAttribute('class', 'cl-main-widget-navigation-items');
    navigationItemLB.setAttribute('class', _this.settings.lbWidget.settings.navigation.tournaments.navigationClass + ' cl-main-widget-navigation-item' + (_this.settings.lbWidget.settings.navigation.tournaments.enable ? '' : ' cl-hidden-navigation-item'));
    navigationItemLBIcon.setAttribute('class', 'cl-main-widget-navigation-lb-icon cl-main-navigation-item');
    navigationItemACH.setAttribute('class', _this.settings.lbWidget.settings.navigation.achievements.navigationClass + ' cl-main-widget-navigation-item' + (_this.settings.lbWidget.settings.navigation.achievements.enable ? '' : ' cl-hidden-navigation-item'));
    navigationItemACHIcon.setAttribute('class', 'cl-main-widget-navigation-ach-icon cl-main-navigation-item');
    navigationItemRewards.setAttribute('class', _this.settings.lbWidget.settings.navigation.rewards.navigationClass + ' cl-main-widget-navigation-item' + (_this.settings.lbWidget.settings.navigation.rewards.enable ? '' : ' cl-hidden-navigation-item'));
    navigationItemRewardsIcon.setAttribute('class', 'cl-main-widget-navigation-rewards-icon cl-main-navigation-item');

    mainSectionContainer.setAttribute('class', 'cl-main-widget-section-container');

    preLoaderContainer.setAttribute('class', 'cl-main-widget-pre-loader');
    preLoaderContent.setAttribute('class', 'cl-main-widget-pre-loader-content');
    preLoaderBar1.setAttribute('class', 'cl-pre-loader-bar');
    preLoaderBar2.setAttribute('class', 'cl-pre-loader-bar');
    preLoaderBar3.setAttribute('class', 'cl-pre-loader-bar');

    preLoaderContent.appendChild(preLoaderBar1);
    preLoaderContent.appendChild(preLoaderBar2);
    preLoaderContent.appendChild(preLoaderBar3);
    preLoaderContainer.appendChild(preLoaderContent);

    navigationItemLB.appendChild(navigationItemLBIcon);
    navigationItems.appendChild(navigationItemLB);
    navigationItemACH.appendChild(navigationItemACHIcon);
    navigationItems.appendChild(navigationItemACH);
    navigationItemRewards.appendChild(navigationItemRewardsIcon);
    navigationItems.appendChild(navigationItemRewards);

    if (_this.settings.lbWidget.settings.navigation.inbox.enable) {
      navigationItemInbox.setAttribute('class', _this.settings.lbWidget.settings.navigation.inbox.navigationClass + ' cl-main-widget-navigation-item');
      navigationItemInboxIcon.setAttribute('class', 'cl-main-widget-navigation-inbox-icon cl-main-navigation-item');
      navigationItemInbox.appendChild(navigationItemInboxIcon);
      navigationItems.appendChild(navigationItemInbox);
    }

    navigationContainer.appendChild(navigationItems);

    mainSectionContainer.appendChild(sectionLB);
    mainSectionContainer.appendChild(sectionACH);
    mainSectionContainer.appendChild(sectionRewards);
    mainSectionContainer.appendChild(sectionInbox);
    mainSectionContainer.appendChild(preLoaderContainer);

    innerWrapper.appendChild(navigationContainer);
    innerWrapper.appendChild(mainSectionContainer);
    wrapper.appendChild(innerWrapper);

    return wrapper;
  };

  this.mainNavigationCheck = function () {
    var _this = this;
    var navItems = query(_this.settings.container, '.cl-main-widget-navigation-item');
    var checkEnabled = 0;

    objectIterator(navItems, function (navItem) {
      if (!hasClass(navItem, 'cl-hidden-navigation-item')) {
        checkEnabled++;
      }
    });

    if (checkEnabled === 1) {
      addClass(query(_this.settings.container, '.cl-main-widget-inner-wrapper'), 'cl-hidden-navigation');
    } else if (checkEnabled === 0) {
      _this.settings.lbWidget.log('All navigation items disabled, check [this.settings.lbWidget.settings.navigation]');
    }
  };

  this.leaderboardAreaLayout = function () {
    var _this = this;
    var sectionLB = document.createElement('div');

    var sectionLBHeader = document.createElement('div');
    var sectionLBHeaderList = document.createElement('div');
    var sectionLBHeaderListIcon = document.createElement('div');
    var sectionLBHeaderLabel = document.createElement('div');
    var sectionLBHeaderDate = document.createElement('div');
    var sectionLBHeaderClose = document.createElement('div');

    var sectionLBDetails = document.createElement('div');
    var sectionLBDetailsInfo = document.createElement('div');
    var sectionLBDetailsInfoIcon = document.createElement('div');
    var sectionLBDetailsImageContainer = document.createElement('div');
    var sectionLBDetailsContentContainer = document.createElement('div');
    var sectionLBDetailsContentContainerLabel = document.createElement('div');
    var sectionLBDetailsContentContainerDate = document.createElement('div');

    var sectionLBLeaderboard = document.createElement('div');
    var sectionLBLeaderboardHeader = document.createElement('div');
    var sectionLBLeaderboardHeaderLabels = document.createElement('div');
    var sectionLBLeaderboardHeaderTopResults = document.createElement('div');
    var sectionLBLeaderboardBody = document.createElement('div');
    var sectionLBLeaderboardBodyResults = document.createElement('div');

    var sectionLBMissingMember = document.createElement('div');

    var sectionLBOptInContainer = document.createElement('div');
    var sectionLBOptInAction = document.createElement('a');

    var sectionLBFooter = document.createElement('div');
    var sectionLBFooterContent = document.createElement('div');

    var sectionTournamentDetailsContainer = document.createElement('div');
    var sectionTournamentDetailsHeader = document.createElement('div');
    var sectionTournamentDetailsHeaderLabel = document.createElement('div');
    var sectionTournamentDetailsHeaderDate = document.createElement('div');
    var sectionTournamentDetailsBackBtn = document.createElement('a');
    var sectionTournamentDetailsBodyContainer = document.createElement('div');
    var sectionTournamentDetailsBodyImageContainer = document.createElement('div');
    var sectionTournamentDetailsBody = document.createElement('div');
    var sectionTournamentDetailsOptInContainer = document.createElement('div');
    var sectionTournamentDetailsOptInAction = document.createElement('a');

    var sectionTournamentList = document.createElement('div');
    var sectionTournamentListBody = document.createElement('div');
    var sectionTournamentListBodyResults = document.createElement('div');
    var sectionTournamentBackAction = document.createElement('a');

    sectionLB.setAttribute('class', _this.settings.lbWidget.settings.navigation.tournaments.containerClass + ' cl-main-section-item cl-main-active-section' + (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner ? ' cl-main-section-image-banner-active' : ''));
    sectionLBHeader.setAttribute('class', 'cl-main-widget-lb-header');
    sectionLBHeaderList.setAttribute('class', 'cl-main-widget-lb-header-list');
    sectionLBHeaderListIcon.setAttribute('class', 'cl-main-widget-lb-header-list-icon');
    sectionLBHeaderLabel.setAttribute('class', 'cl-main-widget-lb-header-label');
    sectionLBHeaderDate.setAttribute('class', 'cl-main-widget-lb-header-date');
    sectionLBHeaderClose.setAttribute('class', 'cl-main-widget-lb-header-close');

    sectionLBDetails.setAttribute('class', 'cl-main-widget-lb-details');
    sectionLBDetailsInfo.setAttribute('class', 'cl-main-widget-lb-details-info');
    sectionLBDetailsInfoIcon.setAttribute('class', 'cl-main-widget-lb-details-info-icon');
    sectionLBDetailsImageContainer.setAttribute('class', 'cl-main-widget-lb-details-image-container');
    sectionLBDetailsContentContainer.setAttribute('class', 'cl-main-widget-lb-details-content');
    sectionLBDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-lb-details-content-label');
    sectionLBDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-lb-details-content-date');

    // Leaderboard result container
    sectionLBLeaderboard.setAttribute('class', 'cl-main-widget-lb-leaderboard');
    sectionLBLeaderboardHeader.setAttribute('class', 'cl-main-widget-lb-leaderboard-header');
    sectionLBLeaderboardHeaderLabels.setAttribute('class', 'cl-main-widget-lb-leaderboard-header-labels');
    sectionLBLeaderboardHeaderTopResults.setAttribute('class', 'cl-main-widget-lb-leaderboard-header-top-res');
    sectionLBLeaderboardBody.setAttribute('class', 'cl-main-widget-lb-leaderboard-body');
    sectionLBLeaderboardBodyResults.setAttribute('class', 'cl-main-widget-lb-leaderboard-body-res');

    sectionLBMissingMember.setAttribute('class', 'cl-main-widget-lb-missing-member');

    // footer
    sectionLBFooter.setAttribute('class', 'cl-main-widget-lb-footer');
    sectionLBFooterContent.setAttribute('class', 'cl-main-widget-lb-footer-content');

    // details section
    sectionTournamentDetailsContainer.setAttribute('class', 'cl-main-widget-lb-details-container');
    sectionTournamentDetailsHeader.setAttribute('class', 'cl-main-widget-lb-details-header');
    sectionTournamentDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-lb-details-header-label');
    sectionTournamentDetailsHeaderDate.setAttribute('class', 'cl-main-widget-lb-details-header-date');
    sectionTournamentDetailsBackBtn.setAttribute('class', 'cl-main-widget-lb-details-back-btn');
    sectionTournamentDetailsBodyContainer.setAttribute('class', 'cl-main-widget-lb-details-body-container');
    sectionTournamentDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-lb-details-body-image-cont');
    sectionTournamentDetailsBody.setAttribute('class', 'cl-main-widget-lb-details-body');
    sectionTournamentDetailsOptInContainer.setAttribute('class', 'cl-main-widget-lb-details-optin-container');
    sectionTournamentDetailsOptInAction.setAttribute('class', 'cl-main-widget-lb-details-optin-action');

    sectionTournamentList.setAttribute('class', 'cl-main-widget-tournaments-list');
    sectionTournamentBackAction.setAttribute('class', 'cl-main-widget-tournaments-back-btn');
    sectionTournamentListBody.setAttribute('class', 'cl-main-widget-tournaments-list-body');
    sectionTournamentListBodyResults.setAttribute('class', 'cl-main-widget-tournaments-list-body-res');

    sectionLBOptInContainer.setAttribute('class', 'cl-main-widget-lb-optin-container');
    sectionLBOptInAction.setAttribute('class', 'cl-main-widget-lb-optin-action');

    sectionLBHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.label;
    sectionLBFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;
    sectionTournamentDetailsOptInAction.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
    sectionTournamentDetailsOptInAction.href = 'javascript:void(0);';
    sectionLBOptInAction.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
    sectionLBOptInAction.href = 'javascript:void(0);';

    sectionLBHeaderList.appendChild(sectionLBHeaderListIcon);
    sectionLBHeader.appendChild(sectionLBHeaderList);
    sectionLBHeader.appendChild(sectionLBHeaderLabel);
    sectionLBHeader.appendChild(sectionLBHeaderDate);
    sectionLBHeader.appendChild(sectionLBHeaderClose);

    sectionLBDetailsInfo.appendChild(sectionLBDetailsInfoIcon);
    sectionLBDetailsContentContainer.appendChild(sectionLBDetailsContentContainerLabel);
    sectionLBDetailsContentContainer.appendChild(sectionLBDetailsContentContainerDate);
    sectionLBDetails.appendChild(sectionLBDetailsInfo);

    if (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner) {
      sectionLBDetails.appendChild(sectionLBDetailsImageContainer);
    }

    sectionLBDetails.appendChild(sectionLBDetailsContentContainer);

    sectionLBLeaderboardHeader.appendChild(sectionLBLeaderboardHeaderLabels);
    sectionLBLeaderboard.appendChild(sectionLBLeaderboardHeader);
    sectionLBLeaderboard.appendChild(sectionLBLeaderboardHeaderTopResults);
    sectionLBLeaderboardBody.appendChild(sectionLBLeaderboardBodyResults);
    sectionLBLeaderboard.appendChild(sectionLBLeaderboardBody);

    sectionLBFooter.appendChild(sectionLBFooterContent);

    sectionTournamentListBody.appendChild(sectionTournamentListBodyResults);
    sectionTournamentList.appendChild(sectionTournamentListBody);
    sectionTournamentList.appendChild(sectionTournamentBackAction);

    sectionTournamentDetailsHeader.appendChild(sectionTournamentDetailsHeaderLabel);
    sectionTournamentDetailsHeader.appendChild(sectionTournamentDetailsHeaderDate);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsHeader);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsBackBtn);
    sectionTournamentDetailsBodyContainer.appendChild(sectionTournamentDetailsBodyImageContainer);
    sectionTournamentDetailsBodyContainer.appendChild(sectionTournamentDetailsBody);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsBodyContainer);
    sectionTournamentDetailsOptInContainer.appendChild(sectionTournamentDetailsOptInAction);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsOptInContainer);

    sectionLBOptInContainer.appendChild(sectionLBOptInAction);

    sectionLB.appendChild(sectionLBHeader);
    sectionLB.appendChild(sectionLBDetails);
    sectionLB.appendChild(sectionLBLeaderboard);
    sectionLB.appendChild(sectionLBMissingMember);
    sectionLB.appendChild(sectionLBOptInContainer);
    sectionLB.appendChild(sectionLBFooter);
    sectionLB.appendChild(sectionTournamentDetailsContainer);
    sectionLB.appendChild(sectionTournamentList);

    return sectionLB;
  };

  this.achievementsAreaLayout = function () {
    var _this = this;
    var sectionACH = document.createElement('div');

    var sectionACHHeader = document.createElement('div');
    var sectionACHHeaderLabel = document.createElement('div');
    var sectionACHHeaderDate = document.createElement('div');
    var sectionACHHeaderClose = document.createElement('div');

    var sectionACHDetails = document.createElement('div');
    var sectionACHDetailsInfo = document.createElement('div');
    var sectionACHDetailsInfoIcon = document.createElement('div');
    var sectionACHDetailsContentContainer = document.createElement('div');
    var sectionACHDetailsContentContainerLabel = document.createElement('div');
    var sectionACHDetailsContentContainerDate = document.createElement('div');

    var sectionACHList = document.createElement('div');
    var sectionACHListBody = document.createElement('div');
    var sectionACHListBodyResults = document.createElement('div');

    var sectionACHFooter = document.createElement('div');
    var sectionACHFooterContent = document.createElement('div');

    var sectionAchievementDetailsContainer = document.createElement('div');
    var sectionAchievementDetailsHeader = document.createElement('div');
    var sectionAchievementDetailsHeaderLabel = document.createElement('div');
    var sectionAchievementDetailsHeaderDate = document.createElement('div');
    var sectionAchievementDetailsBackBtn = document.createElement('a');
    var sectionAchievementDetailsBodyContainer = document.createElement('div');
    var sectionAchievementDetailsBodyImageContainer = document.createElement('div');
    var sectionAchievementDetailsBody = document.createElement('div');

    sectionACH.setAttribute('class', _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' cl-main-section-item');
    sectionACHHeader.setAttribute('class', 'cl-main-widget-ach-header');
    sectionACHHeaderLabel.setAttribute('class', 'cl-main-widget-ach-header-label');
    sectionACHHeaderDate.setAttribute('class', 'cl-main-widget-ach-header-date');
    sectionACHHeaderClose.setAttribute('class', 'cl-main-widget-ach-header-close');

    sectionACHDetails.setAttribute('class', 'cl-main-widget-ach-details');
    sectionACHDetailsInfo.setAttribute('class', 'cl-main-widget-ach-details-info');
    sectionACHDetailsInfoIcon.setAttribute('class', 'cl-main-widget-ach-details-info-icon');
    sectionACHDetailsContentContainer.setAttribute('class', 'cl-main-widget-ach-details-content');
    sectionACHDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-ach-details-content-label');
    sectionACHDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-ach-details-content-date');

    // Leaderboard result container
    sectionACHList.setAttribute('class', 'cl-main-widget-ach-list');
    sectionACHListBody.setAttribute('class', 'cl-main-widget-ach-list-body');
    sectionACHListBodyResults.setAttribute('class', 'cl-main-widget-ach-list-body-res');

    // footer
    sectionACHFooter.setAttribute('class', 'cl-main-widget-ach-footer');
    sectionACHFooterContent.setAttribute('class', 'cl-main-widget-ach-footer-content');

    // details section
    sectionAchievementDetailsContainer.setAttribute('class', 'cl-main-widget-ach-details-container');
    sectionAchievementDetailsHeader.setAttribute('class', 'cl-main-widget-ach-details-header');
    sectionAchievementDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-ach-details-header-label');
    sectionAchievementDetailsHeaderDate.setAttribute('class', 'cl-main-widget-ach-details-header-date');
    sectionAchievementDetailsBackBtn.setAttribute('class', 'cl-main-widget-ach-details-back-btn');
    sectionAchievementDetailsBodyContainer.setAttribute('class', 'cl-main-widget-ach-details-body-container');
    sectionAchievementDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-ach-details-body-image-cont');
    sectionAchievementDetailsBody.setAttribute('class', 'cl-main-widget-ach-details-body');

    sectionACHHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.achievements.label;
    sectionACHFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;

    sectionAchievementDetailsHeader.appendChild(sectionAchievementDetailsHeaderLabel);
    sectionAchievementDetailsHeader.appendChild(sectionAchievementDetailsHeaderDate);
    sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsHeader);
    sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsBackBtn);
    sectionAchievementDetailsBodyContainer.appendChild(sectionAchievementDetailsBodyImageContainer);
    sectionAchievementDetailsBodyContainer.appendChild(sectionAchievementDetailsBody);
    sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsBodyContainer);

    sectionACHHeader.appendChild(sectionACHHeaderLabel);
    sectionACHHeader.appendChild(sectionACHHeaderDate);
    sectionACHHeader.appendChild(sectionACHHeaderClose);

    sectionACHDetailsInfo.appendChild(sectionACHDetailsInfoIcon);
    sectionACHDetailsContentContainer.appendChild(sectionACHDetailsContentContainerLabel);
    sectionACHDetailsContentContainer.appendChild(sectionACHDetailsContentContainerDate);
    sectionACHDetails.appendChild(sectionACHDetailsInfo);
    sectionACHDetails.appendChild(sectionACHDetailsContentContainer);

    sectionACHListBody.appendChild(sectionACHListBodyResults);
    sectionACHList.appendChild(sectionACHListBody);

    sectionACHFooter.appendChild(sectionACHFooterContent);

    sectionACH.appendChild(sectionACHHeader);
    sectionACH.appendChild(sectionACHDetails);
    sectionACH.appendChild(sectionACHList);
    sectionACH.appendChild(sectionACHFooter);
    sectionACH.appendChild(sectionAchievementDetailsContainer);

    return sectionACH;
  };

  this.rewardsAreaLayout = function () {
    var _this = this;
    var sectionRewards = document.createElement('div');

    var sectionRewardsHeader = document.createElement('div');
    var sectionRewardsHeaderLabel = document.createElement('div');
    var sectionRewardsHeaderDate = document.createElement('div');
    var sectionRewardsHeaderClose = document.createElement('div');

    var sectionRewardsDetails = document.createElement('div');
    var sectionRewardsDetailsInfo = document.createElement('div');
    var sectionRewardsDetailsInfoIcon = document.createElement('div');
    var sectionRewardsDetailsContentContainer = document.createElement('div');
    var sectionRewardsDetailsContentContainerLabel = document.createElement('div');
    var sectionRewardsDetailsContentContainerDate = document.createElement('div');

    var sectionRewardsList = document.createElement('div');
    var sectionRewardsListBody = document.createElement('div');
    var sectionRewardsListBodyResults = document.createElement('div');

    var sectionRewardsFooter = document.createElement('div');
    var sectionRewardsFooterContent = document.createElement('div');

    var sectionRewardsDetailsContainer = document.createElement('div');
    var sectionRewardsDetailsHeader = document.createElement('div');
    var sectionRewardsDetailsHeaderLabel = document.createElement('div');
    var sectionRewardsDetailsHeaderDate = document.createElement('div');
    var sectionRewardsDetailsBackBtn = document.createElement('a');
    var sectionRewardsDetailsBodyContainer = document.createElement('div');
    var sectionRewardsDetailsBodyImageContainer = document.createElement('div');
    var sectionRewardsDetailsBody = document.createElement('div');
    var sectionRewardsWinningsContainer = document.createElement('div');
    var sectionRewardsWinningsIcon = document.createElement('div');
    var sectionRewardsWinningsValue = document.createElement('div');
    var sectionRewardsClaimContainer = document.createElement('div');
    var sectionRewardsClaimBtn = document.createElement('a');

    sectionRewards.setAttribute('class', _this.settings.lbWidget.settings.navigation.rewards.containerClass + ' cl-main-section-item');
    sectionRewardsHeader.setAttribute('class', 'cl-main-widget-reward-header');
    sectionRewardsHeaderLabel.setAttribute('class', 'cl-main-widget-reward-header-label');
    sectionRewardsHeaderDate.setAttribute('class', 'cl-main-widget-reward-header-date');
    sectionRewardsHeaderClose.setAttribute('class', 'cl-main-widget-reward-header-close');

    sectionRewardsDetails.setAttribute('class', 'cl-main-widget-reward-details');
    sectionRewardsDetailsInfo.setAttribute('class', 'cl-main-widget-reward-details-info');
    sectionRewardsDetailsInfoIcon.setAttribute('class', 'cl-main-widget-reward-details-info-icon');
    sectionRewardsDetailsContentContainer.setAttribute('class', 'cl-main-widget-reward-details-content');
    sectionRewardsDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-reward-details-content-label');
    sectionRewardsDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-reward-details-content-date');

    // Leaderboard result container
    sectionRewardsList.setAttribute('class', 'cl-main-widget-reward-list');
    sectionRewardsListBody.setAttribute('class', 'cl-main-widget-reward-list-body');
    sectionRewardsListBodyResults.setAttribute('class', 'cl-main-widget-reward-list-body-res');

    // footer
    sectionRewardsFooter.setAttribute('class', 'cl-main-widget-reward-footer');
    sectionRewardsFooterContent.setAttribute('class', 'cl-main-widget-reward-footer-content');

    // details section
    sectionRewardsDetailsContainer.setAttribute('class', 'cl-main-widget-reward-details-container');
    sectionRewardsDetailsHeader.setAttribute('class', 'cl-main-widget-reward-details-header');
    sectionRewardsDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-reward-details-header-label');
    sectionRewardsDetailsHeaderDate.setAttribute('class', 'cl-main-widget-reward-details-header-date');
    sectionRewardsDetailsBackBtn.setAttribute('class', 'cl-main-widget-reward-details-back-btn');
    sectionRewardsDetailsBodyContainer.setAttribute('class', 'cl-main-widget-reward-details-body-container');
    sectionRewardsDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-reward-details-body-image-cont');
    sectionRewardsDetailsBody.setAttribute('class', 'cl-main-widget-reward-details-body');
    sectionRewardsWinningsContainer.setAttribute('class', 'cl-main-widget-reward-winnings-container');
    sectionRewardsWinningsIcon.setAttribute('class', 'cl-main-widget-reward-winnings-icon');
    sectionRewardsWinningsValue.setAttribute('class', 'cl-main-widget-reward-winnings-value');
    sectionRewardsClaimContainer.setAttribute('class', 'cl-main-widget-reward-claim-container');
    sectionRewardsClaimBtn.setAttribute('class', 'cl-main-widget-reward-claim-btn');

    sectionRewardsHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.rewards.label;
    sectionRewardsFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;
    sectionRewardsClaimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claim;

    sectionRewardsWinningsContainer.appendChild(sectionRewardsWinningsIcon);
    sectionRewardsWinningsContainer.appendChild(sectionRewardsWinningsValue);
    sectionRewardsClaimContainer.appendChild(sectionRewardsClaimBtn);

    sectionRewardsDetailsHeader.appendChild(sectionRewardsDetailsHeaderLabel);
    sectionRewardsDetailsHeader.appendChild(sectionRewardsDetailsHeaderDate);
    sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsHeader);
    sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsBackBtn);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsDetailsBodyImageContainer);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsDetailsBody);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsWinningsContainer);
    sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsBodyContainer);
    sectionRewardsDetailsContainer.appendChild(sectionRewardsClaimContainer);

    sectionRewardsHeader.appendChild(sectionRewardsHeaderLabel);
    sectionRewardsHeader.appendChild(sectionRewardsHeaderDate);
    sectionRewardsHeader.appendChild(sectionRewardsHeaderClose);

    sectionRewardsDetailsInfo.appendChild(sectionRewardsDetailsInfoIcon);
    sectionRewardsDetailsContentContainer.appendChild(sectionRewardsDetailsContentContainerLabel);
    sectionRewardsDetailsContentContainer.appendChild(sectionRewardsDetailsContentContainerDate);
    sectionRewardsDetails.appendChild(sectionRewardsDetailsInfo);
    sectionRewardsDetails.appendChild(sectionRewardsDetailsContentContainer);

    sectionRewardsListBody.appendChild(sectionRewardsListBodyResults);
    sectionRewardsList.appendChild(sectionRewardsListBody);

    sectionRewardsFooter.appendChild(sectionRewardsFooterContent);

    sectionRewards.appendChild(sectionRewardsHeader);
    sectionRewards.appendChild(sectionRewardsDetails);
    sectionRewards.appendChild(sectionRewardsList);
    sectionRewards.appendChild(sectionRewardsFooter);
    sectionRewards.appendChild(sectionRewardsDetailsContainer);

    return sectionRewards;
  };

  this.inboxAreaLayout = function () {
    var _this = this;
    var sectionInbox = document.createElement('div');

    var sectionInboxHeader = document.createElement('div');
    var sectionInboxHeaderLabel = document.createElement('div');
    var sectionInboxHeaderDate = document.createElement('div');
    var sectionInboxHeaderClose = document.createElement('div');

    var sectionInboxDetails = document.createElement('div');
    var sectionInboxDetailsInfo = document.createElement('div');
    var sectionInboxDetailsInfoIcon = document.createElement('div');
    var sectionInboxDetailsContentContainer = document.createElement('div');
    var sectionInboxDetailsContentContainerLabel = document.createElement('div');
    var sectionInboxDetailsContentContainerDate = document.createElement('div');

    var sectionInboxList = document.createElement('div');
    var sectionInboxListBody = document.createElement('div');
    var sectionInboxListBodyResults = document.createElement('div');

    var sectionInboxFooter = document.createElement('div');
    var sectionInboxFooterContent = document.createElement('div');

    var sectionInboxDetailsContainer = document.createElement('div');
    var sectionInboxDetailsHeader = document.createElement('div');
    var sectionInboxDetailsHeaderLabel = document.createElement('div');
    var sectionInboxDetailsHeaderDate = document.createElement('div');
    var sectionInboxDetailsBackBtn = document.createElement('a');
    var sectionInboxDetailsBodyContainer = document.createElement('div');
    var sectionInboxDetailsBody = document.createElement('div');

    sectionInbox.setAttribute('class', _this.settings.lbWidget.settings.navigation.inbox.containerClass + ' cl-main-section-item');
    sectionInboxHeader.setAttribute('class', 'cl-main-widget-inbox-header');
    sectionInboxHeaderLabel.setAttribute('class', 'cl-main-widget-inbox-header-label');
    sectionInboxHeaderDate.setAttribute('class', 'cl-main-widget-inbox-header-date');
    sectionInboxHeaderClose.setAttribute('class', 'cl-main-widget-inbox-header-close');

    sectionInboxDetails.setAttribute('class', 'cl-main-widget-inbox-details');
    sectionInboxDetailsInfo.setAttribute('class', 'cl-main-widget-inbox-details-info');
    sectionInboxDetailsInfoIcon.setAttribute('class', 'cl-main-widget-inbox-details-info-icon');
    sectionInboxDetailsContentContainer.setAttribute('class', 'cl-main-widget-inbox-details-content');
    sectionInboxDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-inbox-details-content-label');
    sectionInboxDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-inbox-details-content-date');

    // Leaderboard result container
    sectionInboxList.setAttribute('class', 'cl-main-widget-inbox-list');
    sectionInboxListBody.setAttribute('class', 'cl-main-widget-inbox-list-body');
    sectionInboxListBodyResults.setAttribute('class', 'cl-main-widget-inbox-list-body-res');

    // footer
    sectionInboxFooter.setAttribute('class', 'cl-main-widget-inbox-footer');
    sectionInboxFooterContent.setAttribute('class', 'cl-main-widget-inbox-footer-content');

    // details section
    sectionInboxDetailsContainer.setAttribute('class', 'cl-main-widget-inbox-details-container');
    sectionInboxDetailsHeader.setAttribute('class', 'cl-main-widget-inbox-details-header');
    sectionInboxDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-inbox-details-header-label');
    sectionInboxDetailsHeaderDate.setAttribute('class', 'cl-main-widget-inbox-details-header-date');
    sectionInboxDetailsBackBtn.setAttribute('class', 'cl-main-widget-inbox-details-back-btn');
    sectionInboxDetailsBodyContainer.setAttribute('class', 'cl-main-widget-inbox-details-body-container');
    sectionInboxDetailsBody.setAttribute('class', 'cl-main-widget-inbox-details-body');

    sectionInboxHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.messages.label;
    sectionInboxFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;

    sectionInboxHeader.appendChild(sectionInboxHeaderLabel);
    sectionInboxHeader.appendChild(sectionInboxHeaderDate);
    sectionInboxHeader.appendChild(sectionInboxHeaderClose);

    sectionInboxDetailsInfo.appendChild(sectionInboxDetailsInfoIcon);
    sectionInboxDetailsContentContainer.appendChild(sectionInboxDetailsContentContainerLabel);
    sectionInboxDetailsContentContainer.appendChild(sectionInboxDetailsContentContainerDate);
    sectionInboxDetails.appendChild(sectionInboxDetailsInfo);
    sectionInboxDetails.appendChild(sectionInboxDetailsContentContainer);

    sectionInboxListBody.appendChild(sectionInboxListBodyResults);
    sectionInboxList.appendChild(sectionInboxListBody);

    sectionInboxDetailsHeader.appendChild(sectionInboxDetailsHeaderLabel);
    sectionInboxDetailsHeader.appendChild(sectionInboxDetailsHeaderDate);
    sectionInboxDetailsContainer.appendChild(sectionInboxDetailsHeader);
    sectionInboxDetailsContainer.appendChild(sectionInboxDetailsBackBtn);
    sectionInboxDetailsBodyContainer.appendChild(sectionInboxDetailsBody);
    sectionInboxDetailsContainer.appendChild(sectionInboxDetailsBodyContainer);

    sectionInboxFooter.appendChild(sectionInboxFooterContent);

    sectionInbox.appendChild(sectionInboxHeader);
    sectionInbox.appendChild(sectionInboxDetails);
    sectionInbox.appendChild(sectionInboxList);
    sectionInbox.appendChild(sectionInboxFooter);
    sectionInbox.appendChild(sectionInboxDetailsContainer);

    return sectionInbox;
  };

  this.leaderboardHeader = function () {
    var _this = this;
    var rankCol = document.createElement('div');
    var iconCol = document.createElement('div');
    var nameCol = document.createElement('div');
    var growthCol = document.createElement('div');
    var pointsCol = document.createElement('div');

    rankCol.setAttribute('class', 'cl-rank-col cl-col');
    iconCol.setAttribute('class', 'cl-icon-col cl-col');
    nameCol.setAttribute('class', 'cl-name-col cl-col');
    growthCol.setAttribute('class', 'cl-growth-col cl-col');
    pointsCol.setAttribute('class', 'cl-points-col cl-col');

    rankCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.rank;
    iconCol.innerHTML = '';
    nameCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.name;
    growthCol.innerHTML = '';
    pointsCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.points;

    _this.settings.leaderboard.header.appendChild(rankCol);
    _this.settings.leaderboard.header.appendChild(iconCol);
    _this.settings.leaderboard.header.appendChild(nameCol);
    _this.settings.leaderboard.header.appendChild(growthCol);
    _this.settings.leaderboard.header.appendChild(pointsCol);

    var rewardCol = document.createElement('div');
    var rewardEnabled = (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);
    rewardCol.setAttribute('class', 'cl-reward-col cl-col' + (rewardEnabled ? ' cl-col-reward-enabled' : ''));
    rewardCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.prize;

    addClass(_this.settings.leaderboard.header, 'cl-reward-enabled');

    _this.settings.leaderboard.header.appendChild(rewardCol);
  };

  this.leaderboardRow = function (rank, icon, name, change, growth, points, reward, count, memberFound) {
    var _this = this;
    var cellWrapper = document.createElement('div');
    var rankCel = document.createElement('div');
    var rankCelValue = document.createElement('div');
    var iconCel = document.createElement('div');
    var iconCelImg = new Image();
    var nameCel = document.createElement('div');
    var growthCel = document.createElement('div');
    var pointsCel = document.createElement('div');
    var memberFoundClass = (memberFound) ? ' cl-lb-member-row' : '';

    cellWrapper.setAttribute('class', 'cl-lb-row cl-lb-rank-' + rank + ' cl-lb-count-' + count + memberFoundClass);
    rankCel.setAttribute('class', 'cl-rank-col cl-col cl-rank-' + rank);
    rankCelValue.setAttribute('class', 'cl-rank-col-value');
    iconCel.setAttribute('class', 'cl-icon-col cl-col');
    iconCelImg.setAttribute('class', 'cl-icon-col-img');
    nameCel.setAttribute('class', 'cl-name-col cl-col');
    growthCel.setAttribute('class', 'cl-growth-col cl-col');
    pointsCel.setAttribute('class', 'cl-points-col cl-col');

    cellWrapper.dataset.rank = rank;

    rankCelValue.innerHTML = rank;
    nameCel.innerHTML = name;
    growthCel.dataset.growth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    growthCel.dataset.change = change;
    growthCel.innerHTML = growth;
    pointsCel.innerHTML = points;

    if (icon.length > 0) {
      iconCelImg.src = icon;
      iconCelImg.alt = name;
    } else {
      iconCelImg.style.display = 'none';
    }

    rankCel.appendChild(rankCelValue);
    cellWrapper.appendChild(rankCel);
    iconCel.appendChild(iconCelImg);
    cellWrapper.appendChild(iconCel);
    cellWrapper.appendChild(nameCel);
    cellWrapper.appendChild(growthCel);
    cellWrapper.appendChild(pointsCel);

    var rewardCel = document.createElement('div');
    var rewardEnabled = (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);
    rewardCel.setAttribute('class', 'cl-reward-col cl-col' + (rewardEnabled ? ' cl-col-reward-enabled' : ''));
    rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';

    addClass(cellWrapper, 'cl-reward-enabled');

    cellWrapper.appendChild(rewardCel);

    return cellWrapper;
  };

  this.leaderboardRowUpdate = function (rank, icon, name, change, growth, points, reward, count, memberFound, onMissing) {
    var _this = this;
    var cellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + count);

    if (cellRow === null) {
      onMissing(rank, icon, name, change, growth, points, reward, count, memberFound);
    } else {
      var rankCel = query(cellRow, '.cl-rank-col-value');
      var iconCel = query(cellRow, '.cl-icon-col-img');
      var nameCel = query(cellRow, '.cl-name-col');
      var growthCel = query(cellRow, '.cl-growth-col');
      var pointsCel = query(cellRow, '.cl-points-col');
      var memberFoundClass = 'cl-lb-member-row';
      var rowHasClass = hasClass(cellRow, memberFoundClass);

      if (count > 0 && !hasClass(cellRow, 'cl-shared-rank')) {
        addClass(cellRow, 'cl-shared-rank');
      }

      if (memberFound && !rowHasClass) {
        addClass(cellRow, memberFoundClass);
      } else if (!memberFound && rowHasClass) {
        removeClass(cellRow, memberFoundClass);
      }

      cellRow.dataset.rank = rank;

      rankCel.innerHTML = rank;
      nameCel.innerHTML = name;

      growthCel.dataset.growth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      growthCel.dataset.change = change;
      growthCel.innerHTML = growth;

      pointsCel.innerHTML = points;

      if (icon.length > 0) {
        iconCel.src = icon;
        iconCel.alt = name;
        iconCel.style.display = 'block';
      } else {
        iconCel.style.display = 'none';
      }

      if (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0) {
        var rewardCel = query(cellRow, '.cl-reward-col');
        if (rewardCel !== null) {
          rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';
        }
      }
    }
  };

  this.populateLeaderboardResultsWithDefaultEntries = function () {
    var _this = this;
    var topResults = [];
    var remainingResults = [];

    for (let i = 0; i < _this.settings.leaderboard.topResultSize; i++) {
      const rank = i + 1;

      topResults.push({
        name: '--',
        rank: rank,
        points: '--',
        memberId: '',
        memberRefId: ''
      });
    }

    for (let s = _this.settings.leaderboard.topResultSize; s < _this.settings.leaderboard.defaultEmptyList; s++) {
      const rank = s + 1;

      remainingResults.push({
        name: '--',
        rank: rank,
        points: '--',
        memberId: '',
        memberRefId: ''
      });
    }

    _this.updateLeaderboardTopResults(topResults);
    _this.updateLeaderboardResults(remainingResults);
  };

  this.updateLeaderboardTopResults = function (topResults) {
    var _this = this;
    var rankCheck = [];
    var cleanupRankCheck = [];

    // cleanup
    window.mapObject(topResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-row'), function (obj) {
      var rank = parseInt(obj.dataset.rank);
      if (cleanupRankCheck.indexOf(rank) === -1 && rank > _this.settings.leaderboard.defaultEmptyList) {
        remove(obj);
      }
    });

    window.mapObject(topResults, function (lb) {
      var count = 0;
      var icon = _this.settings.lbWidget.populateIdenticonBase64Image(lb.memberId);
      var memberFound = (_this.settings.lbWidget.settings.memberId === lb.memberId || _this.settings.lbWidget.settings.memberId === lb.memberRefId);
      var memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : lb.name;
      var reward = _this.getReward(lb.rank);
      var change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      var growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      var growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (var rc = 0; rc < rankCheck.length; rc++) {
          if (lb.rank === rankCheck[rc]) {
            count++;
          }
        }
      }

      _this.leaderboardRowUpdate(
        lb.rank,
        icon, // icon
        memberName,
        change,
        growthIcon, // growth
        lb.points,
        reward, // reward
        count,
        memberFound,
        function (rank, icon, name, change, growth, points, reward, count, memberFound) {
          var newRow = _this.leaderboardRow(rank, icon, name, change, growth, points, reward, count, memberFound);
          var prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

          if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
            appendNext(prevCellRow, newRow);
          } else {
            _this.settings.leaderboard.topResults.appendChild(newRow);
          }
        }
      );

      rankCheck.push(lb.rank);
    });
  };

  this.getReward = function (rank) {
    var _this = this;
    var rewardResponse = [];

    if (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null) {
      window.mapObject(_this.settings.lbWidget.settings.competition.activeContest.rewards, function (reward) {
        if (reward.rewardRank instanceof Array && reward.rewardRank.indexOf(rank) !== -1) {
          rewardResponse.push(_this.settings.lbWidget.settings.rewards.rewardFormatter(reward));
        }
      });
    }

    return rewardResponse.join(', ');
  };

  this.updateLeaderboardResults = function (remainingResults) {
    var _this = this;
    var rankCheck = [];
    var cleanupRankCheck = [];

    // cleanup
    window.mapObject(remainingResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.list, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.container, '.cl-lb-row'), function (obj) {
      var rank = parseInt(obj.dataset.rank);
      if (cleanupRankCheck.indexOf(rank) === -1 && rank > _this.settings.leaderboard.defaultEmptyList) {
        remove(obj);
      }
    });

    window.mapObject(remainingResults, function (lb) {
      var count = 0;
      var icon = _this.settings.lbWidget.populateIdenticonBase64Image(lb.memberId);
      var memberFound = (_this.settings.lbWidget.settings.memberId === lb.memberId || _this.settings.lbWidget.settings.memberId === lb.memberRefId);
      var memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : lb.name;
      var reward = _this.getReward(lb.rank);
      var change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      var growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      var growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (var rc = 0; rc < rankCheck.length; rc++) {
          if (lb.rank === rankCheck[rc]) {
            count++;
          }
        }
      }

      _this.leaderboardRowUpdate(
        lb.rank,
        icon, // icon
        memberName,
        change,
        growthIcon, // growth
        lb.points,
        reward,
        count,
        memberFound,
        function (rank, icon, name, change, growth, points, reward, count, memberFound) {
          var newRow = _this.leaderboardRow(rank, icon, name, name, growth, points, reward, count, memberFound);
          var prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

          if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
            appendNext(prevCellRow, newRow);
          } else {
            _this.settings.leaderboard.list.appendChild(newRow);
          }
        }
      );

      rankCheck.push(lb.rank);
    });
  };

  this.updateLeaderboard = function () {
    var _this = this;
    var topResults = [];
    var remainingResults = [];

    _this.populateLeaderboardResultsWithDefaultEntries();

    window.mapObject(_this.settings.lbWidget.settings.leaderboard.leaderboardData, function (lb) {
      if (lb.rank <= _this.settings.leaderboard.topResultSize) {
        topResults.push(lb);
      } else {
        remainingResults.push(lb);
      }
    });

    _this.updateLeaderboardTopResults(topResults);
    _this.updateLeaderboardResults(remainingResults);

    var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');
    if (member !== null) {
      _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
    }
  };

  this.updateLeaderboardTime = function () {
    var _this = this;
    var diff = moment(_this.settings.lbWidget.settings.competition.activeContest.scheduledStart).diff(moment());
    var date = _this.settings.lbWidget.formatDateTime(moment.duration(diff));

    if (_this.settings.leaderboard.timerInterval) {
      clearTimeout(_this.settings.leaderboard.timerInterval);
    }

    if (diff < 0 && _this.settings.lbWidget.settings.competition.activeContest.statusCode === 0) {
      date = '';
    } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode > 0 && _this.settings.lbWidget.settings.competition.activeContest.statusCode < 3) {
      diff = moment(_this.settings.lbWidget.settings.competition.activeContest.scheduledEnd).diff(moment());
      date = _this.settings.lbWidget.formatDateTime(moment.duration(diff));
    } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode === 3) {
      date = _this.settings.lbWidget.settings.translation.tournaments.finishing;
    } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode >= 4) {
      date = _this.settings.lbWidget.settings.translation.tournaments.finished;
    }

    _this.settings.headerDate.innerHTML = date;
    _this.settings.detailsContainerDate.innerHTML = date;

    _this.settings.leaderboard.timerInterval = setTimeout(function () {
      _this.updateLeaderboardTime();
    }, 1000);
  };

  this.leaderboardDetailsUpdate = function () {
    var _this = this;
    var mainLabel = query(_this.settings.section, '.cl-main-widget-lb-details-content-label');

    if (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner) {
      var image = query(_this.settings.section, '.cl-main-widget-lb-details-image-container');
      var body = document.createElement('div');
      image.innerHTML = '';

      body.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest.description.length > 0) ? _this.settings.lbWidget.settings.competition.activeContest.description : _this.settings.lbWidget.settings.competition.activeCompetition.description;

      if (_this.settings.lbWidget.settings.competition.extractImageHeader) {
        objectIterator(query(body, 'img'), function (img, key, count) {
          if (count === 0) {
            var newImg = img.cloneNode(true);
            addClass(newImg, 'cl-main-widget-lb-details-image');
            image.appendChild(newImg);

            remove(img);
          }
        });
      }
    }

    mainLabel.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest !== null) ? _this.settings.lbWidget.settings.competition.activeContest.label : _this.settings.lbWidget.settings.translation.tournaments.noAvailableCompetitions;
  };

  this.leaderboardOptInCheck = function () {
    var _this = this;
    var optIn = query(_this.settings.section, '.cl-main-widget-lb-optin-action');

    if (typeof _this.settings.lbWidget.settings.competition.activeCompetition !== 'undefined' && _this.settings.lbWidget.settings.competition.activeCompetition !== null && typeof _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired === 'boolean' && _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired) {
      if (typeof _this.settings.lbWidget.settings.competition.activeCompetition.optin === 'boolean' && !_this.settings.lbWidget.settings.competition.activeCompetition.optin) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
        optIn.parentNode.style.display = 'block';
      } else {
        optIn.parentNode.style.display = 'none';
      }
    } else {
      optIn.parentNode.style.display = 'none';
    }
  };

  // cleanup/recover activity
  this.preLoaderRerun = function () {
    var _this = this;

    if (_this.settings.preLoader.preLoaderActive && _this.settings.preLoader.preloaderCallbackRecovery !== null &&
      _this.settings.preLoader.preLoaderlastAttempt !== null && typeof _this.settings.preLoader.preLoaderlastAttempt === 'number' &&
      (_this.settings.preLoader.preLoaderlastAttempt + 8000) < new Date().getTime()) {
      _this.settings.preLoader.preloaderCallbackRecovery();
    }
  };

  this.preloader = function () {
    var _this = this;
    var preLoader = query(_this.settings.section, '.cl-main-widget-pre-loader');
    // var content = query(_this.settings.section, '.cl-main-widget-pre-loader-content');

    return {
      show: function (callback) {
        _this.settings.preLoader.preLoaderActive = true;
        _this.settings.preLoader.preLoaderlastAttempt = new Date().getTime();
        preLoader.style.display = 'block';
        setTimeout(function () {
          preLoader.style.opacity = 1;
        }, 20);

        if (_this.settings.preLoader.preloaderCallbackRecovery === null && typeof callback === 'function') {
          _this.settings.preLoader.preloaderCallbackRecovery = callback;
        }

        callback();
      },
      hide: function () {
        _this.settings.preLoader.preLoaderActive = false;
        _this.settings.preLoader.preLoaderlastAttempt = null;
        preLoader.style.opacity = 0;

        if (_this.settings.preLoader.preloaderCallbackRecovery !== null) {
          _this.settings.preLoader.preloaderCallbackRecovery = null;
        }

        setTimeout(function () {
          preLoader.style.display = 'none';
        }, 200);
      }
    };
  };

  this.loadLeaderboard = function (callback) {
    var _this = this;

    if (_this.settings.container === null) {
      _this.settings.container = _this.settings.lbWidget.settings.bindContainer.appendChild(_this.layout());
      _this.settings.navigation = query(_this.settings.container, '.cl-main-widget-navigation-container');
      _this.settings.section = query(_this.settings.container, '.cl-main-widget-section-container');
      _this.settings.leaderboard.container = query(_this.settings.section, '.cl-main-widget-lb-leaderboard');
      _this.settings.leaderboard.header = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-header-labels');
      _this.settings.leaderboard.list = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-body-res');
      _this.settings.leaderboard.topResults = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-header-top-res');
      _this.settings.detailsContainer = query(_this.settings.container, '.cl-main-widget-lb-details-container');
      _this.settings.tournamentListContainer = query(_this.settings.container, '.cl-main-widget-tournaments-list');
      _this.settings.detailsContainerDate = query(_this.settings.container, '.cl-main-widget-lb-details-header-date');
      _this.settings.headerDate = query(_this.settings.container, '.cl-main-widget-lb-header-date');
      _this.settings.achievement.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass);
      _this.settings.achievement.detailsContainer = query(_this.settings.container, '.cl-main-widget-ach-details-container');
      _this.settings.reward.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.rewards.containerClass);
      _this.settings.reward.detailsContainer = query(_this.settings.container, '.cl-main-widget-reward-details-container');
      _this.settings.messages.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.inbox.containerClass);
      _this.settings.messages.detailsContainer = query(_this.settings.container, '.cl-main-widget-inbox-details-container');

      _this.mainNavigationCheck();
      _this.leaderboardHeader();
      _this.eventListeners();
    }

    _this.leaderboardOptInCheck();
    _this.leaderboardDetailsUpdate();
    _this.updateLeaderboard();

    if (_this.settings.lbWidget.settings.competition.activeContest !== null) {
      _this.updateLeaderboardTime();
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.clearAll = function () {
    var _this = this;

    _this.settings.active = false;

    if (_this.settings.leaderboard.timerInterval) {
      clearTimeout(_this.settings.leaderboard.timerInterval);
    }

    _this.settings.preLoader.preLoaderActive = false;
  };

  this.hide = function (callback) {
    var _this = this;

    _this.clearAll();

    if (_this.settings.container !== null) {
      removeClass(_this.settings.container, 'cl-show');

      setTimeout(function () {
        _this.settings.container.style.display = 'none';

        _this.hideCompetitionDetails();
        _this.hideAchievementDetails();

        if (typeof callback === 'function') {
          callback();
        }
      }, 30);
    } else if (typeof callback === 'function') {
      callback();
    }
  };

  this.missingMember = function (isVisible) {
    var _this = this;
    var area = query(_this.settings.container, '.cl-main-widget-lb-missing-member');

    if (!isVisible) {
      var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

      if (area !== null && member !== null) {
        area.innerHTML = member.innerHTML;

        area.style.display = 'block';
      } else {
        area.style.display = 'none';
      }
    } else {
      area.style.display = 'none';
    }
  };

  this.isElementVisibleInView = function (el, container) {
    var position = el.getBoundingClientRect();
    var elemContainer = container.getBoundingClientRect();
    var elemTop = position.top;
    var elemBottom = position.bottom;
    var elemHeight = position.height;

    return elemTop <= elemContainer.top
      ? elemContainer.top - elemTop <= elemHeight : elemBottom - elemContainer.bottom <= elemHeight;
  };

  this.eventListeners = function () {
    var _this = this;

    _this.settings.leaderboard.list.parentNode.onscroll = function (evt) {
      evt.preventDefault();
      var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

      if (member !== null) {
        _this.missingMember(_this.isElementVisibleInView(member, evt.target));
      }
    };

    window.onresize = function (evt) {
      var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

      if (member !== null) {
        _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
      }
    };
  };

  // this.checkLeaderboardScrollContainer = function(){
  //  var _this = this,
  //    lbScrollContainer = query(_this.settings.leaderboard.container, ".cl-main-widget-lb-leaderboard-body");
  //
  //  if( scrollEnabled(lbScrollContainer) ){
  //    addClass(lbScrollContainer, "cl-element-scrollable");
  //  }else{
  //    removeClass(lbScrollContainer, "cl-element-scrollable");
  //  }
  // };

  this.competitionDetailsOptInButtonState = function () {
    var _this = this;
    var optIn = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-optin-action');

    if (typeof _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired === 'boolean' && _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired) {
      if (typeof _this.settings.lbWidget.settings.competition.activeCompetition.optin === 'boolean' && !_this.settings.lbWidget.settings.competition.activeCompetition.optin) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
        removeClass(optIn, 'cl-disabled');
      } else {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.registered;
        addClass(optIn, 'cl-disabled');
      }
      optIn.parentNode.style.display = 'block';
    } else {
      optIn.parentNode.style.display = 'none';
    }
  };

  this.loadCompetitionDetails = function (callback) {
    var _this = this;
    var label = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-header-label');
    // var date = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-header-date');
    var body = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body');
    var image = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body-image-cont');

    image.innerHTML = '';
    label.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest.label.length > 0) ? _this.settings.lbWidget.settings.competition.activeContest.label : _this.settings.lbWidget.settings.competition.activeCompetition.label;
    body.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest.description.length > 0) ? _this.settings.lbWidget.settings.competition.activeContest.description : _this.settings.lbWidget.settings.competition.activeCompetition.description;
    _this.competitionDetailsOptInButtonState();

    _this.settings.detailsContainer.style.display = 'block';
    _this.settings.headerDate.style.display = 'none';

    if (_this.settings.lbWidget.settings.competition.extractImageHeader) {
      objectIterator(query(body, 'img'), function (img, key, count) {
        if (count === 0) {
          var newImg = img.cloneNode(true);
          image.appendChild(newImg);

          remove(img);
        }
      });
    }

    setTimeout(function () {
      addClass(_this.settings.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadCompetitionList = function (callback, ajaxInstance) {
    var _this = this;
    var listResContainer = query(_this.settings.tournamentListContainer, '.cl-main-widget-tournaments-list-body-res');
    var preLoader = _this.preloader();

    preLoader.show(function () {
      _this.settings.lbWidget.checkForAvailableCompetitions(function () {
        var accordionObj = _this.accordionStyle(_this.settings.tournamentsSection.accordionLayout, function (accordionSection, listContainer, topEntryContainer, layout) {
          var tournamentData = _this.settings.lbWidget.settings.tournaments[layout.type];

          if (typeof tournamentData !== 'undefined') {
            if (tournamentData.length === 0) {
              accordionSection.style.display = 'none';
            }
            window.mapObject(tournamentData, function (tournament, key, count) {
              if ((count + 1) <= layout.showTopResults && query(topEntryContainer, '.cl-tournament-' + tournament.id) === null) {
                var topEntryContaineRlistItem = _this.tournamentItem(tournament);
                topEntryContainer.appendChild(topEntryContaineRlistItem);
              }

              if (query(listContainer, '.cl-tournament-' + tournament.id) === null) {
                var listItem = _this.tournamentItem(tournament);
                listContainer.appendChild(listItem);
              }
            });
          }
        });

        listResContainer.innerHTML = '';
        listResContainer.appendChild(accordionObj);

        _this.settings.tournamentListContainer.style.display = 'block';
        setTimeout(function () {
          addClass(_this.settings.tournamentListContainer, 'cl-show');

          if (typeof callback === 'function') callback();

          preLoader.hide();
        }, 50);
      }, ajaxInstance);
    });
  };

  this.hideCompetitionList = function (callback) {
    var _this = this;

    removeClass(_this.settings.tournamentListContainer, 'cl-show');

    setTimeout(function () {
      _this.settings.tournamentListContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideCompetitionDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.detailsContainer.style.display = 'none';
      _this.settings.headerDate.style.display = 'block';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.achievementItem = function (ach, achieved, perc) {
    var _this = this;
    var listItem = document.createElement('div');
    var detailsContainer = document.createElement('div');
    var detailsWrapper = document.createElement('div');
    var label = document.createElement('div');
    var category = document.createElement('div');
    var description = document.createElement('div');
    var progressionWrapper = document.createElement('div');
    var progressionCont = document.createElement('div');
    var progressionBar = document.createElement('div');
    var moreButton = document.createElement('a');
    var cpomntainsImage = (typeof ach.icon !== 'undefined' && ach.icon.length > 0);

    listItem.setAttribute('class', 'cl-ach-list-item cl-ach-' + ach.id + (cpomntainsImage ? ' cl-ach-with-image' : ''));
    detailsContainer.setAttribute('class', 'cl-ach-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-ach-list-details-wrap');
    label.setAttribute('class', 'cl-ach-list-details-label');
    category.setAttribute('class', 'cl-ach-list-details-category');
    description.setAttribute('class', 'cl-ach-list-details-description');
    progressionWrapper.setAttribute('class', 'cl-ach-list-progression');
    progressionCont.setAttribute('class', 'cl-ach-list-progression-cont');
    progressionBar.setAttribute('class', 'cl-ach-list-progression-bar');
    moreButton.setAttribute('class', 'cl-ach-list-more');

    moreButton.dataset.id = ach.id;
    moreButton.innerHTML = _this.settings.lbWidget.settings.translation.achievements.more;
    moreButton.href = 'javascript:void(0);';

    listItem.dataset.id = ach.id;

    label.innerHTML = ach.name;
    category.innerHTML = ach.category.join(', ');

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(category);
    detailsWrapper.appendChild(description);

    if (cpomntainsImage) {
      var image = new Image();
      var imageIconWrapper = document.createElement('div');
      imageIconWrapper.setAttribute('class', 'cl-ach-list-item-img-wrapper');
      image.setAttribute('class', 'cl-ach-list-item-img');

      image.src = _this.settings.lbWidget.settings.uri.gatewayDomain + _this.settings.lbWidget.settings.uri.assets.replace(':attachmentId', ach.icon);
      image.alt = ach.name;

      // image.onload = function(){
      // };

      imageIconWrapper.appendChild(image);
      detailsContainer.appendChild(imageIconWrapper);
    }

    detailsContainer.appendChild(detailsWrapper);

    progressionCont.appendChild(progressionBar);
    progressionWrapper.appendChild(progressionCont);
    progressionWrapper.appendChild(moreButton);

    listItem.appendChild(detailsContainer);
    listItem.appendChild(progressionWrapper);

    return listItem;
  };

  this.achievementListLayout = function (achievementData) {
    var _this = this;
    var achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');

    window.mapObject(achievementData, function (ach) {
      if (query(achList, '.cl-ach-' + ach.id) === null) {
        var listItem = _this.achievementItem(ach);

        achList.appendChild(listItem);
      }
    });
  };

  this.loadAchievementDetails = function (data, callback) {
    var _this = this;
    var label = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-header-label');
    var body = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body');
    var image = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-image-cont');

    image.innerHTML = '';

    label.innerHTML = data.data.name;
    body.innerHTML = data.data.description;

    if (_this.settings.lbWidget.settings.achievements.extractImageHeader) {
      var imageLookup = query(body, 'img');
      objectIterator(imageLookup, function (img, key, count) {
        if (count === 0) {
          var newImg = img.cloneNode(true);
          image.appendChild(newImg);

          remove(img);
        }
      });
    }

    _this.settings.achievement.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.achievement.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.hideAchievementDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.achievement.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.achievement.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.loadRewardDetails = function (data, callback) {
    var _this = this;
    var label = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-header-label');
    var body = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-body');
    var image = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-body-image-cont');
    var claimBtn = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-claim-btn');
    var icon = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-icon');
    var value = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-value');

    label.innerHTML = data.data.reward.rewardName;
    body.innerHTML = data.data.reward.description;
    value.innerHTML = _this.settings.lbWidget.settings.rewards.rewardFormatter(data.data.reward);
    claimBtn.dataset.id = data.data.id;

    if (data.data.claimed) {
      addClass(claimBtn, 'cl-claimed');
      claimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claimed;
    } else {
      removeClass(claimBtn, 'cl-claimed');
      claimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claim;
    }

    if (typeof data.data.reward.icon !== 'undefined') {
      icon.innerHTML = '';

      var _image = new Image();
      var imageIconWrapper = document.createElement('div');
      imageIconWrapper.setAttribute('class', 'cl-reward-list-item-img-wrapper');
      _image.setAttribute('class', 'cl-reward-list-item-img');

      _image.src = _this.settings.lbWidget.settings.uri.gatewayDomain + _this.settings.lbWidget.settings.uri.assets.replace(':attachmentId', data.data.reward.icon);
      _image.alt = _this.settings.lbWidget.settings.rewards.rewardFormatter(data.data.reward);

      icon.appendChild(_image);
    } else {
      icon.innerHTML = "<span class='cl-place-holder-reward-image'></span>";
    }

    objectIterator(query(body, 'img'), function (img, key, count) {
      if (count === 0) {
        var newImg = img.cloneNode(true);
        image.innerHTML = '';
        image.appendChild(newImg);

        remove(img);
      }
    });

    _this.settings.reward.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.reward.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadMessageDetails = function (data, callback) {
    var _this = this;
    var label = query(_this.settings.messages.detailsContainer, '.cl-main-widget-inbox-details-header-label');
    var body = query(_this.settings.messages.detailsContainer, '.cl-main-widget-inbox-details-body');

    label.innerHTML = data.data.subject;
    body.innerHTML = data.data.body;

    _this.settings.messages.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.messages.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.hideRewardDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.reward.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.reward.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideMessageDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.messages.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.messages.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.updateAchievementProgressionAndIssued = function (issued, progression) {
    var _this = this;
    var achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');

    objectIterator(query(achList, '.cl-ach-list-item'), function (ach) {
      var id = ach.dataset.id;
      var issuedStatus = (issued.indexOf(id) !== -1);

      var perc = 0;
      window.mapObject(progression, function (pr) {
        if (pr.achievementId === id) {
          perc = (parseFloat(pr.goalPercentageComplete) * 100).toFixed(1);
        }
      });

      if (ach !== null) {
        var bar = query(ach, '.cl-ach-list-progression-bar');

        if (issuedStatus) {
          addClass(bar, 'cl-ach-complete');
          bar.innerHTML = _this.settings.lbWidget.settings.translation.achievements.complete;
          bar.style.width = '100%';
        } else {
          bar.style.width = ((perc > 1 || perc === 0) ? perc : 1) + '%';
        }
      }
    });
  };

  this.loadAchievements = function (callback) {
    var _this = this;

    _this.settings.lbWidget.checkForAvailableAchievements(function (achievementData) {
      _this.achievementListLayout(achievementData);

      var idList = [];
      window.mapObject(_this.settings.lbWidget.settings.achievements.list, function (ach) {
        idList.push(ach.id);
      });

      setTimeout(function () {
        _this.settings.lbWidget.checkForMemberAchievementsIssued(function (issued) {
          _this.settings.lbWidget.checkForMemberAchievementsProgression(idList, function (progression) {
            _this.updateAchievementProgressionAndIssued(issued, progression);
          });
        });
      }, 400);

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.rewardItem = function (rew) {
    var _this = this;
    var listItem = document.createElement('div');
    var detailsContainer = document.createElement('div');
    var detailsWrapper = document.createElement('div');
    var label = document.createElement('div');
    var description = document.createElement('div');

    listItem.setAttribute('class', 'cl-rew-list-item cl-rew-' + rew.id);
    detailsContainer.setAttribute('class', 'cl-rew-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-rew-list-details-wrap');
    label.setAttribute('class', 'cl-rew-list-details-label');
    description.setAttribute('class', 'cl-rew-list-details-description');

    listItem.dataset.id = rew.id;
    var labelText = stripHtml(rew.subject);
    var descriptionText = stripHtml(rew.body);

    if (typeof rew.prize !== 'undefined') {
      listItem.dataset.rewardId = rew.prize.id;
      labelText = stripHtml(rew.subject + ' - ' + rew.prize.reward.rewardName + ' (' + _this.settings.lbWidget.settings.rewards.rewardFormatter(rew.prize.reward) + ')');
      descriptionText = stripHtml((typeof rew.prize.reward.description !== 'undefined' && rew.prize.reward.description.length > 0) ? rew.prize.reward.description : rew.body);
    }

    label.innerHTML = (labelText.length > 80) ? (labelText.substr(0, 80) + '...') : labelText;
    description.innerHTML = (descriptionText.length > 200) ? (descriptionText.substr(0, 200) + '...') : descriptionText;

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(description);
    detailsContainer.appendChild(detailsWrapper);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.messageItem = function (inbox) {
    // var _this = this;
    var listItem = document.createElement('div');
    var detailsContainer = document.createElement('div');
    var detailsWrapper = document.createElement('div');
    var label = document.createElement('div');
    var description = document.createElement('div');
    var content = stripHtml(inbox.body);

    listItem.setAttribute('class', 'cl-inbox-list-item cl-inbox-' + inbox.id);
    detailsContainer.setAttribute('class', 'cl-inbox-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-inbox-list-details-wrap');
    label.setAttribute('class', 'cl-inbox-list-details-label');
    description.setAttribute('class', 'cl-inbox-list-details-description');

    listItem.dataset.id = inbox.id;
    label.innerHTML = (inbox.subject.length > 36) ? inbox.subject.substr(0, 36) + '...' : inbox.subject;
    description.innerHTML = (content.length > 60) ? content.substr(0, 60) + '...' : content;

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(description);
    detailsContainer.appendChild(detailsWrapper);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.tournamentItem = function (tournament) {
    // var _this = this;
    var listItem = document.createElement('div');
    var detailsContainer = document.createElement('div');
    var detailsWrapper = document.createElement('div');
    var label = document.createElement('div');
    var description = document.createElement('div');
    var descriptionContent = stripHtml(tournament.description);

    listItem.setAttribute('class', 'cl-tour-list-item cl-tour-' + tournament.id);
    detailsContainer.setAttribute('class', 'cl-tour-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-tour-list-details-wrap');
    label.setAttribute('class', 'cl-tour-list-details-label');
    description.setAttribute('class', 'cl-tour-list-details-description');

    listItem.dataset.id = tournament.id;
    label.innerHTML = tournament.label;
    description.innerHTML = (descriptionContent.length > 100) ? descriptionContent.substr(0, 100) + '...' : descriptionContent;

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(description);
    detailsContainer.appendChild(detailsWrapper);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.rewardsListLayout = function (rewards, availableRewards, expiredRewards) {
    var _this = this;
    var rewardList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.rewards.containerClass + ' .cl-main-widget-reward-list-body-res');

    var accordionObj = _this.accordionStyle(_this.settings.rewardsSection.accordionLayout, function (accordionSection, listContainer, topEntryContainer, layout) {
      var rewardData = _this.settings.lbWidget.settings.rewards[layout.type];

      if (typeof rewardData !== 'undefined') {
        if (rewardData.length === 0) {
          accordionSection.style.display = 'none';
        }
        window.mapObject(rewardData, function (rew, key, count) {
          if ((count + 1) <= layout.showTopResults && query(topEntryContainer, '.cl-reward-' + rew.id) === null) {
            var topEntryContaineRlistItem = _this.rewardItem(rew);
            topEntryContainer.appendChild(topEntryContaineRlistItem);
          }

          if (query(listContainer, '.cl-reward-' + rew.id) === null) {
            var listItem = _this.rewardItem(rew);
            listContainer.appendChild(listItem);
          }
        });
      }
    });

    rewardList.innerHTML = '';
    rewardList.appendChild(accordionObj);

    // mapObject(rewardData, function(rew){
    //   if( query(rewardList, ".cl-reward-" + rew.id) === null ) {
    //     var listItem = _this.rewardItem(rew);
    //
    //     rewardList.appendChild(listItem);
    //   }
    // });
  };

  this.messagesListLayout = function (rewards, availableRewards, expiredRewards) {
    var _this = this;
    var messageList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.inbox.containerClass + ' .cl-main-widget-inbox-list-body-res');

    messageList.innerHTML = '';

    window.mapObject(_this.settings.lbWidget.settings.messages.messages, function (inboxItem, key, count) {
      var listItem = _this.messageItem(inboxItem);
      messageList.appendChild(listItem);
    });
  };

  this.loadRewards = function (callback) {
    var _this = this;

    _this.settings.lbWidget.checkForAvailableRewards(function (rewards, availableRewards, expiredRewards) {
      _this.rewardsListLayout(rewards, availableRewards, expiredRewards);

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.loadMessages = function (callback) {
    var _this = this;

    _this.settings.lbWidget.checkForAvailableMessages(function (rewards, availableRewards, expiredRewards) {
      _this.messagesListLayout(rewards, availableRewards, expiredRewards);

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  var changeInterval;
  var changeContainerInterval;
  this.navigationSwitch = function (target, callback) {
    var _this = this;
    var preLoader = _this.preloader();

    if (_this.settings.navigationSwitchInProgress && _this.settings.navigationSwitchLastAtempt + 3000 < new Date().getTime()) {
      _this.settings.navigationSwitchInProgress = false;
    }

    if (!_this.settings.navigationSwitchInProgress) {
      _this.settings.navigationSwitchInProgress = true;
      _this.settings.navigationSwitchLastAtempt = new Date().getTime();

      if (!hasClass(target.parentNode, 'cl-active-nav')) {
        preLoader.show(function () {
          if (changeInterval) clearTimeout(changeInterval);
          if (changeContainerInterval) clearTimeout(changeContainerInterval);

          objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
            removeClass(obj, 'cl-active-nav');
          });

          objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
            removeClass(obj, 'cl-main-active-section');
            setTimeout(function () {
              obj.style.display = 'none';
            }, 150);
          });

          changeContainerInterval = setTimeout(function () {
            if (hasClass(target, 'cl-main-widget-navigation-lb-icon')) {
              _this.loadLeaderboard(function () {
                var lbContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.tournaments.containerClass);

                lbContainer.style.display = 'block';
                changeInterval = setTimeout(function () {
                  addClass(lbContainer, 'cl-main-active-section');
                }, 30);

                if (typeof callback === 'function') {
                  callback();
                }

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (hasClass(target, 'cl-main-widget-navigation-ach-icon')) {
              _this.loadAchievements(function () {
                var achContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.achievements.containerClass);

                _this.settings.achievement.detailsContainer.style.display = 'none';

                achContainer.style.display = 'block';
                changeInterval = setTimeout(function () {
                  addClass(achContainer, 'cl-main-active-section');

                  if (typeof callback === 'function') {
                    callback();
                  }
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (hasClass(target, 'cl-main-widget-navigation-rewards-icon')) {
              _this.loadRewards(function () {
                var rewardsContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.rewards.containerClass);

                rewardsContainer.style.display = 'block';
                changeInterval = setTimeout(function () {
                  addClass(rewardsContainer, 'cl-main-active-section');
                }, 30);

                if (typeof callback === 'function') {
                  callback();
                }

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (hasClass(target, 'cl-main-widget-navigation-inbox-icon')) {
              _this.loadMessages(function () {
                var inboxContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.inbox.containerClass);

                inboxContainer.style.display = 'block';
                changeInterval = setTimeout(function () {
                  addClass(inboxContainer, 'cl-main-active-section');
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            }
          }, 250);

          addClass(target.parentNode, 'cl-active-nav');
        });
      } else if (typeof callback === 'function') {
        _this.settings.navigationSwitchInProgress = false;
        callback();
      }
    }
  };

  this.resetNavigation = function (callback) {
    var _this = this;

    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
      removeClass(obj, 'cl-active-nav');
    });

    objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
      obj.style.display = 'none';
      removeClass(obj, 'cl-main-active-section');
    });

    var activeNave = false;
    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-container .cl-main-widget-navigation-item'), function (navItem, key, count) {
      if (!activeNave && !hasClass(navItem, 'cl-hidden-navigation-item')) {
        _this.navigationSwitch(query(navItem, '.cl-main-navigation-item'));
        activeNave = true;
      }
    });

    setTimeout(function () {
      if (typeof callback !== 'undefined') callback();
    }, 70);
  };

  this.initLayout = function (callback) {
    var _this = this;

    _this.settings.active = true;

    _this.loadLeaderboard();

    _this.settings.container.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.container, 'cl-show');

      var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');
      if (member !== null) {
        _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
      }

      _this.resetNavigation(callback);
    }, 30);
  };
};
