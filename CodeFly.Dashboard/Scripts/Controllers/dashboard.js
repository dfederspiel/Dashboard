var dashboardApp = angular.module('dashboardApp', []);

dashboardApp.controller('DashboardCtrl', function ($scope) {

    $scope.boards = [];
    $scope.board = {};
    $scope.cards = [];

    $scope.setDashboard = function () {
        console.log(this.board);
        $scope.board = this.board;
        Trello.get('/boards/' + this.board.id + '/cards',
            function (response) {
                console.log(response);
                $scope.cards = response;
                $scope.$apply();
            });
    };

    function success(response) {
        $scope.boards = response;
        $scope.$apply();
    }
    function error(response) { console.log(response); }
    Trello.get('/member/me/boards', success, error);;
});