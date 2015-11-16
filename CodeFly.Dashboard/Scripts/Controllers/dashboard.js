var dashboardApp = angular.module('dashboardApp', ['angular.filter']);

dashboardApp.controller('DashboardCtrl', function ($scope, $q) {

    $scope.boards = [];
    $scope.cards = [];
    $scope.board = {};
    $scope.lists = [];

    //$scope.projects = {
    //    active: null,
    //    onDeck: null,
    //    upcoming: null,
    //    complete: null
    //}

    $scope.members = [];
    $scope.token = [];

    //$scope.activeTasks = null;
    //$scope.upcomingTasks = null;
    //$scope.readyTasks = null;
    //$scope.completedTasks = null;

    $scope.authorized = false;
    $scope.dashboardSet = false;

    // Set Dashboard - preload all necessary data.
    $scope.setDashboard = function () {
        console.log(this.board);
        $scope.board = this.board;
        console.log("Board", this.board);
        hookItem(this.board.id, 'dashboard.dev.codefly.ninja/home/boardactivity');
        //getCards();
        getLists(function () {
            $.each($scope.lists, function (idx, list) {
                hookItem(list.id, 'dashboard.dev.codefly.ninja/home/listactivity');
                console.log("List", list);
                getCards(function (cards) {
                    //list.cards = cards;
                    $.each($scope.cards, function (idx, card) {
                        hookItem(card.id, 'dashboard.dev.codefly.ninja/home/cardactivity');
                        console.log("Card", card);
                    });
                    $scope.dashboardSet = true;
                    $scope.$apply();
                })
            });
        })
    };

    $scope.getPercentComplete = function (card) {
        return 100 * (card.badges.checkItemsChecked / card.badges.checkItems);
    }

    $scope.getListName = function(id){
        return $scope.lists.filter(l => l.id == id)[0].name;
    }

    // Custom Filters
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

    $scope.isInList = function (list) {
        return this.card.idList == list.id;
    }

    // Custom Classes
    $scope.isBlocked = function (c) {
        return this.card.labels.filter(l => l.name == 'Blocked').length > 0;
    }

    $scope.isPending = function (c) {
        return this.card.labels.filter(l => l.name == 'Pending').length > 0;
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

    function getListById(id) {
        return $scope.lists.filter(l => l.id == id)[0];
    }

    // API Methods
    function getBoards(callback) {
        Trello.get('/member/me/boards',
            function (response) {
                $scope.boards = response;
                callback();
            });
    }

    function getLists(callback) {
        Trello.get('/boards/' + $scope.board.id + '/lists',
            function (response) {
                $scope.lists = response;
                callback();
            });
    }

    function getCards(callback) {
        Trello.get('/boards/' + $scope.board.id + '/cards',
            function (response) {
                $scope.cards = response;
                callback();
            });
    }

    function getCardsForList(listId, callback) {
        Trello.get('/lists/' + listId + '/cards',
            function (response) {
                callback(response);
            });
    }

    function getToken() {
        Trello.get('/members/me/tokens?webhooks=true', function (response) {
            $scope.token = response.filter(i => i.identifier == 'Dashboard by CodeFly')[0];
        });
    }

    function hookItem(id, path) {

        if ($scope.token.webhooks.filter(w => w.idModel == id).length > 0)
            return;

        var parameters = {
            description: "Dashboard Webhook",
            callbackURL: path,
            idModel: id
        };

        Trello.post('/webhooks/', parameters, function (response) {
            console.log("Successfully Create Webhook", response);
        }, function (response) {
            console.log("Failed to Create Webhook", response);
        });
    }

    function unhookItem(id) {
        Trello.delete('/webhooks/' + id, function (response) {
            console.log("Successfully removed hook.", response);
        },
        function (response) {
            console.log("Could not remove hook.", response);
        });
    }

    // SignalR 
    var dashboard = $.connection.trelloWebhookHub;

    // Create a function that the hub can call back to announce data.
    dashboard.client.handleWebHook = function (data) {
        if (data == '') return;

        var json = JSON.parse(data);
        console.log(json);

        switch (json.action.type) {
            case 'updateCard':
                console.log('Update Card');
                break;
            default:
                console.log('Unhandled Action:' + json.action.type);
                break;
        }
    }

    dashboard.client.handleBoardActivity = function (data) {
        if (data == '') return;

        var json = JSON.parse(data);
        console.log('Board Update (' + json.action.type + ')', json);
    }

    dashboard.client.handleListActivity = function (data) {
        if (data == '') return;

        var json = JSON.parse(data);
        console.log('List Update (' + json.action.type + ')', json);

        //switch (json.action.type) {
        //    case 'updateCard':
        //        var targetList = getListById(json.action.data.card.idList);
        //        var oldList = getListById(json.action.data.old.idList);

        //        if (targetList && oldList) {

        //            var cardToMove = oldList.cards.filter(function (obj) {
        //                return obj.id === json.action.data.card.id;
        //            });

        //            if (cardToMove.length > 0) {
        //                targetList.cards.push(cardToMove);

        //                oldList.cards = oldList.cards.filter(function (obj) {
        //                    return obj.id !== json.action.data.card.id;
        //                });
        //            }
        //        }
        //        break;
        //}

        $scope.$apply();
    }

    dashboard.client.handleCardActivity = function (data) {
        if (data == '') return;

        var json = JSON.parse(data);
        var card = json.model;
        console.log('Card Update (' + json.action.type + ')', json);

        var target = $scope.cards.filter(c => c.id == json.model.id)[0];
        for (var attrname in card) { target[attrname] = card[attrname]; }

        $scope.$apply();
    }

    // Start the connection.
    $.connection.hub.start().done(function () {
        //$('#sendmessage').click(function () {
        //    // Call the Send method on the hub.
        //    dashboard.server.send(null);
        //});
    });


    // Authentication to Trello using client.js
    if (!Trello.authorized()) {
        Trello.authorize({
            type: "popup",
            name: "Dashboard by CodeFly",
            scope: {
                read: true,
                write: true,
                account: true
            },
            expiration: "never",
            success: function () {
                console.log("Successful authentication");
                $scope.authorized = true;
                getBoards(function () {
                    getToken();
                    $scope.$apply();
                });
            },
            error: function () {
                console.log("Failed authentication");
            }
        });
    } else {
        // Get the member boards
        getBoards(function () { $scope.$apply() });
    }
});