'use strict';

let angular = require('angular');

module.exports = angular.module('spinnaker.search.infrastructure.controller', [
  require('./infrastructureSearch.service.js'),
  require('../../core/history/recentHistory.service.js'),
  require('../searchResult/searchResult.directive.js'),
  require('../../pageTitle/pageTitleService.js'),
  require('./project/infrastructureProject.directive.js'),
])
  .controller('InfrastructureCtrl', function($scope, infrastructureSearchService, $stateParams, $location, searchService,
                                             pageTitleService, _, recentHistoryService, $modal, $state) {

    var search = infrastructureSearchService();

    $scope.viewState = {
      searching: false,
    };

    this.loadRecentItems = () => {
      $scope.recentProjects = recentHistoryService.getItems('projects');

      $scope.recentItems = ['applications', 'loadBalancers', 'serverGroups', 'instances', 'securityGroups']
        .map((category) => {
          return {
            category: category,
            results: recentHistoryService.getItems(category)
              .map((result) => {
                let routeParams = angular.extend(result.params, result.extraData);
                search.formatRouteResult(category, routeParams).then((name) => result.displayName = name);
                return result;
              })
          };
        })
        .filter((category) => {
          return category.results.length;
        });

      this.hasRecentItems = $scope.recentItems.some((category) => {
        return category.results.length > 0;
      });
    };

    $scope.pageSize = searchService.defaultPageSize;

    if (angular.isDefined($location.search().q)) {
      $scope.query = $location.search().q;
    }
    $scope.$watch('query', function(query) {
      $scope.viewState.searching = true;
      $scope.categories = null;
      search.query(query).then(function(result) {
        $scope.categories = result.filter((category) => category.category !== 'Projects' && category.results.length);
        $scope.projects = result.filter((category) => category.category === 'Projects');
        $scope.moreResults = _.sum(result, function(resultSet) {
          return resultSet.results.length;
        }) === $scope.pageSize;
        $location.search('q', query || null);
        $location.replace();
        pageTitleService.handleRoutingSuccess(
          {
            pageTitleMain: {
              label: query ? ' search results for "' + query + '"' : 'Infrastructure'
            }
          }
        );
        $scope.viewState.searching = false;
      });
    });

    this.createProject = () => {
      $modal.open({
        scope: $scope,
        templateUrl: require('../../core/projects/configure/configureProject.modal.html'),
        controller: 'ConfigureProjectModalCtrl',
        controllerAs: 'ctrl',
        resolve: {
          projectConfig: () => { return {}; },
        }
      }).result.then(routeToProject);
    };

    function routeToProject(project) {
      $state.go(
        'home.project.dashboard', {
          project: project.name,
        }
      );
    }

    this.createApplication = () => {
      $modal.open({
        scope: $scope,
        templateUrl: require('../../applications/modal/newapplication.html'),
        controller: 'CreateApplicationModalCtrl',
        controllerAs: 'newAppModal'
      }).result.then(routeToApplication);
    };

    function routeToApplication(app) {
      $state.go(
        'home.applications.application.insight.clusters', {
          application: app.name,
        }
      );
    }

    this.menuActions = [
      {
        displayName: 'Create Application',
        action: this.createApplication
      },
      {
        displayName: 'Create Project',
        action: this.createProject
      }
    ];

    this.hasResults = () => angular.isObject($scope.categories) && Object.keys($scope.categories).length > 0 && $scope.query && $scope.query.length > 0;

    this.noMatches = () => angular.isObject($scope.categories) && Object.keys($scope.categories).length === 0 && $scope.query && $scope.query.length > 0;

    this.showRecentResults = () => this.hasRecentItems && !$scope.viewState.searching && $scope.categories.every((category) => !category.results.length);

    this.removeRecentItem = (category, id, index) => {
      recentHistoryService.removeItem(category, id);
      $scope.recentItems.find((test) => test.category === category).results.splice(index, 1);
    };

    this.removeRecentProject = (id, index) => {
      recentHistoryService.removeItem('projects', id);
      $scope.recentProjects.splice(index, 1);
    };

    this.loadRecentItems();

  }).name;
