var dashboardApp = angular.module('dashboardApp', []);

dashboardApp.controller('DashboardCtrl', function ($scope, $q) {

    $scope.lists = [];
    $scope.members = [];
    $scope.boards = [];
    $scope.cards = [];

    $scope.board = {};
    $scope.authorized = false;

    // Click handler
    $scope.setDashboard = function () {
        console.log(this.board);
        $scope.board = this.board;
        Trello.get('/boards/' + this.board.id + '/cards',
            function (response) {
                console.log(response);
                $scope.cards = response;
                getLists();
                $scope.$apply();
            });
    };


    $scope.getStatus = function (o) {
        for (var x = 0; x < $scope.lists.length; x++) {
            if (o == $scope.lists[x].is)
                return $scope.lists[x].name;
        }
    }

    $scope.getCompletion = function (o) {
        // first get checklists
        Trello.get('/card/' + o.id + '/checklists',
             function (response) {

                 var totalItems = 0;
                 var totalItemsChecked = 0;

                 if (response) {
                     $.each(response, function (idx, o) {
                         $.each(o.checkItems, function (idx, o) {
                             totalItems += 1;
                             if (o.state == 'complete')
                                 totalItemsChecked += 1;
                         });
                     });
                 }

                 if (totalItems == 0)
                     return '';

                 return 100 * (totalItemsChecked / totalItems);
             },
             function () {
                 return '';
             });
    }

    // Custom filter
    $scope.notLabeled = function (o) {
        var isNotLabeled = true;
        var taskNames = ['Project', 'Change Order', 'Support', 'Content'];
        for (var x = 0 ; x < o.labels.length; x++) {
            for (var i = 0; i < taskNames.length; i++) {
                if (o.labels[x].name == taskNames[i])
                    isNotLabeled = false;
            }
        }
        return isNotLabeled;
    };

    $scope.activeProjects = function (o) {
        var inProgressStatusId = getIdForStatus('In Progress');
        var taskNames = ['Project', 'Change Order', 'Support', 'Content'];
        for (var x = 0 ; x < o.labels.length; x++) {
            for (var i = 0; i < taskNames.length; i++) {
                if (o.labels[x].name == 'Project') {
                    if (o.idList == inProgressStatusId)
                        return true;
                }
            }
        }
        return false;
    }

    // Helpers
    function getIdForStatus(s) {
        var id = null;
        $.each($scope.lists, function (idx, o) {
            if (o.name == s)
                id = o.id;
        });
        return id;
    }

    // API Methods
    function getBoards() {
        Trello.get('/member/me/boards',
            function (response) {
                $scope.boards = response;
                $scope.$apply();
            },
            function (response) {
                console.log(response);
            });
    }

    function getLists() {
        Trello.get('/boards/' + $scope.board.id + '/lists',
            function (response) {
                $scope.lists = response;
            },
            function () {
                console.log(response);
            });
    }

    function getCheckLists(card) {
        Trello.get('/card/' + card.id + '/checklists',
            function (response) {
                return response;
            },
            function () {
                return [];
            });
    }


    // Authentication
    var authenticationSuccess = function () {
        console.log("Successful authentication");
        $scope.authorized = true;
        getBoards();
    };
    var authenticationFailure = function () {
        console.log("Failed authentication");
    };

    if (!Trello.authorized()) {
        Trello.authorize({
            type: "popup",
            name: "Pegboard by CodeFly",
            scope: {
                read: true,
                write: true
            },
            expiration: "never",
            success: authenticationSuccess,
            error: authenticationFailure
        });
    } else {
        getBoards();
    }
});