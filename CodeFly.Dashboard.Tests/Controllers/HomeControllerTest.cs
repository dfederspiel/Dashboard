using System.Web.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using CodeFly.Dashboard;
using CodeFly.Dashboard.Controllers;
using TrelloNet;
using TrelloNet.Extensions;
using System.Net;
using System;
using System.Linq;
using System.Collections.Generic;
using TrelloNet.Internal;
using System.Threading.Tasks;

namespace CodeFly.Dashboard.Tests.Controllers
{
    [TestClass]
    public class HomeControllerTest
    {
        public string key = "c5f5588eef0a17225de05d7c4f8c77a3";
        public string secret = "932ef9552a7e026235fc9122403ed860abd62fdb04a49ca11731aac7800906a2";
        public string tokenid = "e8d33f542f8cf123d055ef7b3da570dca18110db471c6e5e68862b51a010e8b5";
        [TestMethod]
        public void Index()
        {
            // Arrange
            HomeController controller = new HomeController();

            // Act
            ViewResult result = controller.Index() as ViewResult;

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("Home Page", result.ViewBag.Title);
        }

        [TestMethod]
        public void GetCompanyFromTrello()
        {
            HomeController controller = new HomeController();

            ITrello trello = new Trello(key);
            //var url = trello.GetAuthorizationUrl("CodeFly Dashboard", Scope.ReadWrite);

            //WebClient client = new WebClient();
            //string response = client.DownloadString(url);

            trello.Authorize(tokenid);

            var organizations = trello.Organizations.ForMe();

            // Get a member
            Member memberTrello = trello.Members.WithId("trello");

            // Get the authenticated member
            Member me = trello.Members.Me();
            Console.WriteLine(me.FullName);

            // Get a board
            Board theTrelloDevBoard = trello.Boards.WithId("4d5ea62fd76aa1136000000c");
            Console.WriteLine(theTrelloDevBoard.Name);

            // Get an organization
            Organization trelloApps = trello.Organizations.WithId("trelloapps");
            Console.WriteLine(trelloApps.DisplayName);

            // Get all members of a board
            IEnumerable<Member> membersOfTrelloDevBoard = trello.Members.ForBoard(theTrelloDevBoard);

            // Get all owners of a board
            IEnumerable<Member> ownersOfTrelloDevBoard = trello.Members.ForBoard(theTrelloDevBoard, MemberFilter.Owners);

            // Get all members of an organization
            IEnumerable<Member> membersInTrelloAppsOrg = trello.Members.ForOrganization(trelloApps);

            // Get all boards of a member
            IEnumerable<Board> allMyBoards = trello.Boards.ForMember(me);

            //Get all boards of an organization
            IEnumerable<Board> allBoardsOfTrelloAppsOrg = trello.Boards.ForOrganization(trelloApps);

            // Get all closed boards of an organization
            IEnumerable<Board> closedBoardsOfTrelloAppsOrg = trello.Boards.ForOrganization(trelloApps, BoardFilter.Closed);

            // Get all lists on a board
            IEnumerable<List> allListsInTheTrelloDevBoard = trello.Lists.ForBoard(theTrelloDevBoard);

            // Get all cards on a board
            IEnumerable<Card> allCardsOnTheTrelloDevBoard = trello.Cards.ForBoard(theTrelloDevBoard);

            // Get all cards assigned to a member
            IEnumerable<Card> allCardsAssignedToMe = trello.Cards.ForMember(me);

            // Get all organizations that a member belongs to
            IEnumerable<Organization> allMyOrganizations = trello.Organizations.ForMember(me);

            // Get unread notifications
            IEnumerable<Notification> notifications = trello.Notifications.ForMe(readFilter: ReadFilter.Unread);

            // Get a token
            Token token = trello.Tokens.WithToken("[a token]");

            // Get all actions since last view
            foreach (TrelloNet.Action action in trello.Actions.ForMe(since: Since.LastView))
                Console.WriteLine(action.Date);

            // Create a new board
            Board aNewBoard = trello.Boards.Add(new NewBoard("A new board"));

            // Close a board
            trello.Boards.Close(aNewBoard);

            // Create a new list
            List aNewList = trello.Lists.Add(new NewList("A new list", aNewBoard));

            // Archive a list
            trello.Lists.Archive(aNewList);

            // Create a card
            Card aNewCard = trello.Cards.Add(new NewCard("A new card", aNewList));

            // Label card
            trello.Cards.AddLabel(aNewCard, Color.Green);

            // Assign member to card
            trello.Cards.AddMember(aNewCard, me);

            // Delete a card
            trello.Cards.Delete(aNewCard);

            // Comment on a card
            trello.Cards.AddComment(aNewCard, "My comment");

            // Update entire card (also works for list, board and checklist)
            aNewCard.Name = "an updated name";
            aNewCard.Desc = "an updated description";
            trello.Cards.Update(aNewCard);

            // Create a checklist
            Checklist aNewChecklist = trello.Checklists.Add("My checklist", aNewBoard);

            // Add the checklist to a card
            trello.Cards.AddChecklist(aNewCard, aNewChecklist);

            // Add check items
            trello.Checklists.AddCheckItem(aNewChecklist, "My check item");

            // Search in Boards, Cards, Members, Organizations and Actions
            var results = trello.Search("some search query");
            Console.WriteLine("Found {0} boards", results.Boards.Count);
            Console.WriteLine("Found {0} cards", results.Cards.Count);
            Console.WriteLine("Found {0} members", results.Members.Count);
            // etc...

            // Or search per model individually
            IEnumerable<Card> cards = trello.Cards.Search("some search query", limit: 10);
            foreach (var card in cards)
                Console.WriteLine(card.Name);

            // Do things asynchronously! Same API as the sync one, except the methods returns Task.
            Task<IEnumerable<Card>> cardsTask = trello.Async.Cards.ForMe();
            cardsTask.Wait();

            // Fetch actions and notifications without having to deal with paging (use namespace TrelloNet.Extensions)
            IEnumerable<TrelloNet.Action> allActionsForABoard = trello.Actions.AutoPaged().ForBoard(aNewBoard);
            IEnumerable<Notification> allMyNotifications = trello.Notifications.AutoPaged().ForMe();

            // Example: Check all unchecked check items on all cards on a specified board async
            var changeStateTasks = from card in trello.Cards.ForBoard(new BoardId(""))
                                   from checkList in card.Checklists
                                   from checkItem in checkList.CheckItems
                                   where !checkItem.Checked
                                   select trello.Async.Cards.ChangeCheckItemState(card, checkList, checkItem, true);
            Task.WaitAll(changeStateTasks.ToArray());

            // If you need to call the trello api in a way that Trello.NET does not support, you can issue a custom request. 
            // Look at the API reference https://trello.com/docs/api/index.html
            // This example gets a list and all it's cards in the same request
            dynamic myList = trello.Advanced.Get("/lists/1234567890abcdefghijklmn", new { cards = "all" });
            Console.WriteLine(myList.name);
            foreach (var card in myList.cards)
                Console.WriteLine(card.name);

        }
    }
}
