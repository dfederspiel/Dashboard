using CodeFly.Dashboard.Hubs;
using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace CodeFly.Dashboard.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Title = "Home Page";
            return View();
        }

        public ActionResult BoardActivity()
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<TrelloWebhookHub>();
            hubContext.Clients.All.handleBoardActivity(getPostData());
            return View("Index");
        }

        public ActionResult CardActivity()
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<TrelloWebhookHub>();
            hubContext.Clients.All.handleCardActivity(getPostData());
            return View("Index");
        }

        public ActionResult ListActivity()
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<TrelloWebhookHub>();
            hubContext.Clients.All.handleListActivity(getPostData());
            return View("Index");
        }

        private string getPostData()
        {
            return new System.IO.StreamReader(Request.InputStream).ReadToEnd();
        }
    }
}
