var dashboardApp = angular.module('dashboardApp', ['angular.filter', 'kendo.directives']);

dashboardApp.controller('DashboardCtrl', ['$scope', 'Card', 'Board', 'List', 'Member', function ($scope, Card, Board, List, Member) {

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
    $scope.dashboardLoading = false;

    $scope.chartone = {
        title: {
            position: "bottom",
            text: "Project Distribution"
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
                template: "#= category #: \n #= value#%",
                color: "#aaaaaa"
            }
        },
        series: [{
            type: "pie",
            startAngle: 150,
            data: [{
                category: "Projects",
                value: 53.8,
                color: "#068c35"
            }, {
                category: "Change Orders",
                value: 16.1,
                color: "#90cc38"
            }, {
                category: "Support",
                value: 11.3,
                color: "#068c35"
            }, {
                category: "Content",
                value: 9.6,
                color: "#006634"
            }]
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }
    };

    $scope.charttwo = {
        title: {
            position: "bottom",
            text: "Active vs. Inactive"
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
                template: "#= category #: \n #= value#%",
                color: "#aaaaaa"
            }
        },
        series: [{
            type: "pie",
            startAngle: 150,
            data: [{
                category: "Projects",
                value: 53.8,
                color: "#068c35"
            }, {
                category: "Change Orders",
                value: 16.1,
                color: "#90cc38"
            }, {
                category: "Support",
                value: 11.3,
                color: "#068c35"
            }, {
                category: "Content",
                value: 9.6,
                color: "#006634"
            }]
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }
    };

    $scope.chartthree = {
        title: {
            position: "bottom",
            text: "TFS Data"
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
                template: "#= category #: \n #= value#%",
                color: "#aaaaaa"
            }
        },
        series: [{
            type: "pie",
            startAngle: 150,
            data: [{
                category: "Checkins",
                value: 53.8,
                color: "blue"
            }, {
                category: "All Hours",
                value: 16.1,
                color: "#90cc38"
            }, {
                category: "Other Stuff",
                value: 11.3,
                color: "#068c35"
            }, {
                category: "Content",
                value: 9.6,
                color: "#006634"
            }]
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }
    };

    // Context Helpers
    $scope.setDashboard = function () {

        if ($scope.dashboardLoading) return;

        $scope.dashboardLoading = true;
        $scope.board = this.board;
        hookItem(this.board.id, 'dashboard.dev.codefly.ninja/home/boardactivity');

        getMembers(function () {
        });

        getLists(function () {
            $.each($scope.lists, function (idx, list) {
                hookItem(list.id, 'dashboard.dev.codefly.ninja/home/listactivity');
            });

            getCards(function (cards) {
                $.each($scope.cards, function (idx, card) {
                    hookItem(card.id, 'dashboard.dev.codefly.ninja/home/cardactivity');
                });
                $scope.dashboardSet = true;
                $scope.dashboardLoading = false;
                $scope.$apply();
            });
        });
    };

    $scope.percentComplete = function (card) {
        return 100 * (card.badges.checkItemsChecked / card.badges.checkItems);
    }

    $scope.getListName = function (id) {
        for (var x = 0; x < $scope.lists.length; x++) {
            if ($scope.lists[x].id == id)
                return $scope.lists[x].name;
        }
    }

    $scope.numberOfAssignedProjects = function (id) {
        var cards = getActiveProjects();
        var count = 0;
        for (var x = 0; x < cards.length; x++) {
            if (isMemberOfCard(cards[x], id))
                count++;
        }
        return count;
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
        //return this.card.labels.filter(l => l.name == 'Blocked').length > 0;
        for (var x = 0; x < this.card.labels.length; x++) {
            if (this.card.labels[x].name == 'Blocked')
                return true;
        }
    }

    $scope.isPending = function (c) {
        //return this.card.labels.filter(l => l.name == 'Pending').length > 0;
        for (var x = 0; x < this.card.labels.length; x++) {
            if (this.card.labels[x].name == 'Pending')
                return true;
        }
    }

    $scope.hasStatus = function (status) {
        for (var x = 0; x < this.card.labels.length; x++) {
            if (this.card.labels[x].name == status)
                return true;
        }
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
        //return $scope.lists.filter(l => l.id == id)[0];
        for (var x = 0; x < $scope.lists.length; x++) {
            if ($scope.lists[x].id == id)
                return true;
        }
    }

    function isMemberOfCard(card, id) {
        for (var x = 0; x < card.idMembers.length; x++) {
            if (card.idMembers[x] == id)
                return true;
        }
    }

    function getActiveProjects() {
        var activeProjects = [];
        for (var x = 0; x < $scope.cards.length; x++) {
            if ($scope.cards[x].list == "In Progress") {
                activeProjects.push($scope.cards[x]);
            }
        }
        return activeProjects;
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

    function getMembers(callback) {

        for (var x = 0; x < $scope.board.memberships.length; x++) {
            Trello.get('/members/' + $scope.board.memberships[x].idMember, function (response) {
                $scope.members.push(new Member(response));
            });
        }

        //Trello.get('/boards/' + $scope.board.id + '/members',
        //function (response) {
        //    for (var x = 0; x < response.length; x++) {
        //        $scope.members.push(new Member(response[x]))
        //    }
        //    callback();
        //});
    }

    function getCardsForList(listId, callback) {
        Trello.get('/lists/' + listId + '/cards',
            function (response) {
                callback(response);
            });
    }

    function getToken() {
        Trello.get('/members/me/tokens?webhooks=true', function (response) {
            //$scope.token = response.filter(i => i.identifier == 'Dashboard by CodeFly')[0];
            for (var x = 0; x < response.length; x++) {
                if (response[x].identifier == 'Dashboard by CodeFly')
                    $scope.token = response[x];
            }
        });
    }



    // Webhooks
    function hookItem(id, path) {
        for (var x = 0; x < $scope.token.webhooks.length; x++) {
            if ($scope.token.webhooks[x].idModel == id)
                return;  // don't hook it again
        }

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

        switch (json.action.type) {
            case 'updateCard':
                //if (json.action.data.list && json.action.data.list.name == 'Done!!!') {
                //    go();
                //    var audio = new Audio('Content/audio/awesome.mp3');
                //    audio.play();
                //}
                break;
        }

        $scope.$apply();
    }

    dashboard.client.handleCardActivity = function (data) {
        if (data == '' || !$scope.dashboardSet) return;

        var json = JSON.parse(data);
        console.log('Card Update (' + json.action.type + ')', json);

        switch (json.action.type) {
            case 'updateCard':
                if (json.action.data.old.idList != null &&
                    json.action.data.listBefore.name != 'Done!!!' &&
                    json.action.data.listAfter.name == 'Done!!!') {
                    go();
                    var audio = new Audio('Content/audio/awesome.mp3');
                    audio.play();
                    audio.onended = function () {
                        stop();
                    };
                }
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
                //var target = $scope.cards.filter(c => c.id == json.model.id)[0];
                var target = null;
                for (var x = 0; x < $scope.cards.length; x++) {
                    if ($scope.cards[x].id == json.model.id)
                        target = $scope.cards[x];
                }

                if (target !== null)
                    target = target.update(json.model);

                break;
            case 'commentCard':
                $scope.feed.push({
                    type: 'New comment',
                    member: json.action.memberCreator.initials,
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
            expiration: "never",
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
        ctx.hasDueDate = ctx.dueDate != null;
    }

    function getCardType(ctx) {
        var cardType = null;
        for (var x = 0; x < ctx.labels.length; x++) {
            for (var i = 0; i < labels.types.length; i++) {
                if (labels.types[i] == ctx.labels[x].name) {
                    cardType = ctx.labels[x];
                }
            }
        }
        return cardType;
    }

    function getListName(id) {

        //return lists.filter(l => l.id == id)[0].name;

        for (var x = 0; x < lists.length; x++) {
            if (lists[x].id == id)
                return lists[x].name;
        }
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
}).factory('Member', function () {

    function Member(model) {
        for (var attrname in model) { this[attrname] = model[attrname]; }
        if (this.avatarHash != null) {
            this.avatarUrl = this.avatarSource == null ?
                'https://trello-avatars.s3.amazonaws.com/' + this.avatarHash + '/50.png' :
                'http://www.gravatar.com/avatar/' + this.gravatarHash;
        } else {
            this.avatarUrl = 'http://www.someblogsite.com/images/avatars/lego-avatar-crop.jpg';
        }
        console.log("New Member", this);
    }
    return Member;
});
