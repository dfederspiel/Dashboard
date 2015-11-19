var dashboardApp = angular.module('dashboardApp', ['angular.filter', 'kendo.directives']);

dashboardApp.controller('DashboardCtrl', ['$scope', 'Card', 'Board', 'List', function ($scope, Card, Board, List) {

    // Properties
    $scope.boards = [];
    $scope.cards = [];
    $scope.board = {};
    $scope.lists = [];

    $scope.feed = [];

    $scope.members = [];
    $scope.token = [];

    $scope.authorized = false;
    $scope.dashboardSet = false;

    $scope.test = {
        title: {
            position: "bottom",
            text: "Share of Internet Population Growth, 2007 - 2012"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            labels: {
                visible: true,
                background: "transparent",
                template: "#= category #: \n #= value#%"
            }
        },
        series: [{
            type: "pie",
            startAngle: 150,
            data: [{
                category: "Asia",
                value: 53.8,
                color: "#9de219"
            }, {
                category: "Europe",
                value: 16.1,
                color: "#90cc38"
            }, {
                category: "Latin America",
                value: 11.3,
                color: "#068c35"
            }, {
                category: "Africa",
                value: 9.6,
                color: "#006634"
            }, {
                category: "Middle East",
                value: 5.2,
                color: "#004d38"
            }, {
                category: "North America",
                value: 3.6,
                color: "#033939"
            }]
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }
    };



    // Context Helpers
    $scope.setDashboard = function () {

        $scope.board = this.board;
        hookItem(this.board.id, 'dashboard.dev.codefly.ninja/home/boardactivity');

        getLists(function () {
            $.each($scope.lists, function (idx, list) {
                hookItem(list.id, 'dashboard.dev.codefly.ninja/home/listactivity');
            });

            getCards(function (cards) {
                $.each($scope.cards, function (idx, card) {
                    hookItem(card.id, 'dashboard.dev.codefly.ninja/home/cardactivity');
                });
                $scope.dashboardSet = true;
                $scope.$apply();
            });
        });
    };

    $scope.percentComplete = function (card) {
        return 100 * (card.badges.checkItemsChecked / card.badges.checkItems);
    }

    $scope.getListName = function (id) {
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
                for (var x = 0; x < response.length; x++) {
                    if (!response[x].closed)
                        $scope.boards.push(new Board(response[x]))
                }
                callback();
            });
    }

    function getLists(callback) {
        Trello.get('/boards/' + $scope.board.id + '/lists',
            function (response) {
                for (var x = 0; x < response.length; x++) {
                    if (!response[x].closed)
                        $scope.lists.push(new List(response[x]))
                }
                callback();
            });
    }

    function getCards(callback) {
        Trello.get('/boards/' + $scope.board.id + '/cards',
            function (response) {
                for (var x = 0; x < response.length; x++) {
                    $scope.cards.push(new Card(response[x], $scope.lists))
                }
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



    // Webhooks
    function hookItem(id, path) {

        if ($scope.token.webhooks.filter(w => w.idModel == id).length > 0)
            return;

        var parameters = {
            description: "Dashboard Webhook",
            callbackURL: path,
            idModel: id
        };

        Trello.post('/webhooks/', parameters, function (response) {
            console.log("Successfully Created Webhook", response);
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

    dashboard.client.handleBoardActivity = function (data) {
        if (data == '' || !$scope.dashboardSet) return;

        var json = JSON.parse(data);
        console.log('Board Update (' + json.action.type + ')', json);
    }

    dashboard.client.handleListActivity = function (data) {
        if (data == '' || !$scope.dashboardSet) return;

        var json = JSON.parse(data);
        console.log('List Update (' + json.action.type + ')', json);

        $scope.$apply();
    }

    dashboard.client.handleCardActivity = function (data) {
        if (data == '' || !$scope.dashboardSet) return;

        var json = JSON.parse(data);
        console.log('Card Update (' + json.action.type + ')', json);

        switch (json.action.type) {
            case 'updateCard':
            case 'addLabelToCard':
            case 'removeLabelFromCard':
            case 'addChecklistToCard':
            case 'removeChecklistFromCard':
            case 'createCheckItem':
            case 'deleteCheckItem':
            case 'updateCheckItemStateOnCard':
            case 'addMemberToCard':
            case 'removeMemberFromCard':
            case 'addAttachmentToCard':
            case 'deleteAttachmentFromCard':
                var target = $scope.cards.filter(c => c.id == json.model.id)[0];
                target = target.update(json.model);
                break;
            case 'commentCard':
                $scope.feed.push({
                    type: 'New comment',
                    member: json.action.memberCreator.fullName,
                    text: json.action.data.text
                });
                $scope.$apply();
                break;
            default:
                break;

        }

        $scope.cards.sort(function (a, b) {
            return a.pos - b.pos;
        });

        $scope.$apply();
    }

    $.connection.hub.start().done(function () {
        //$('#sendmessage').click(function () {
        //    // Call the Send method on the hub.
        //    dashboard.server.send(null);
        //});
    });




    // Authentication to Trello
    var onAuthorize = function () {
        updateLoggedIn();
        $("#output").empty();

        console.log("Successful authentication");
        $scope.authorized = true;
        getBoards(function () {
            getToken();
            $scope.$apply();
        });

        Trello.members.get("me", function (member) {
            $("#fullName").text(member.fullName);
        });

    };

    var updateLoggedIn = function () {
        var isLoggedIn = Trello.authorized();
        $("#loggedout").toggle(!isLoggedIn);
        $("#loggedin").toggle(isLoggedIn);
    };

    var logout = function () {
        Trello.deauthorize();
        updateLoggedIn();
    };

    Trello.authorize({
        interactive: false,
        success: onAuthorize
    });

    $("#connectLink").click(function () {
        Trello.authorize({
            type: "redirect",
            name: "Dashboard by CodeFly",
            scope: {
                read: true,
                write: true,
                account: true
            },
            expiration: "1hour",
            success: onAuthorize
        })
    });
    $("#disconnect").click(logout);

}]).factory('Card', function () {
    /**
     * Constructor, with class name
     */
    var labels = {
        statuses: ['Pending', 'Blocked'],
        types: ['Project', 'Change Order', 'Support', 'Content']
    }

    var lists = [];

    function Card(model, listCollection) {
        // Public properties, assigned to the instance ('this')
        for (var attrname in model) {
            this[attrname] = model[attrname];
        }
        lists = listCollection;
        calculateNewValues(this);
        console.log("New Card", this);
    }

    /**
     * Public method, assigned to prototype
     */
    Card.prototype.update = function (model) {
        for (var attrname in model) {
            this[attrname] = model[attrname];
        }
        calculateNewValues(this);
    };

    /**
     * Private property
     */
    //var possibleRoles = ['admin', 'editor', 'guest'];

    /**
     * Private functions
     */
    //function checkRole(role) {
    //    return possibleRoles.indexOf(role) !== -1;
    //}
    function calculateNewValues(ctx) {
        ctx.percentComplete = 100 * (ctx.badges.checkItemsChecked / ctx.badges.checkItems);
        ctx.type = getCardType(ctx);
        ctx.list = getListName(ctx.idList);
        ctx.dueDate = (ctx.badges.due == null) ? null : new Date(ctx.badges.due).toDateString()
    }

    function getCardType(ctx) {
        var cardType = null;
        for (var x = 0; x < ctx.labels.length; x++) {
            for (var i = 0; i < labels.types.length; i++) {
                if (labels.types[i] == ctx.labels[x].name) {
                    cardType = ctx.labels[x].name;
                }
            }
        }
        return cardType;
    }

    function getListName(id) {

        return lists.filter(l => l.id == id)[0].name;

    }

    /**
     * Static property
     * Using copy to prevent modifications to private property
     */
    //Card.possibleRoles = angular.copy(possibleRoles);

    /**
     * Static method, assigned to class
     * Instance ('this') is not available in static context
     */
    //Card.build = function (data) {
    //    if (!checkRole(data.role)) {
    //        return;
    //    }
    //    return new Card(
    //      data.first_name,
    //      data.last_name,
    //      data.role,
    //      Organisation.build(data.organisation) // another model
    //    );
    //};

    /**
     * Return the constructor function
     */
    return Card;

}).factory('Board', function () {

    function Board(model) {
        for (var attrname in model) { this[attrname] = model[attrname]; }
        console.log("New Board", this);
    }

    return Board;
}).factory('List', function () {

    function List(model) {
        for (var attrname in model) { this[attrname] = model[attrname]; }
        console.log("New List", this);
    }
    return List;
});