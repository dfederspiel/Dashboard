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

        public ActionResult Hook()
        {
            // To make this work, create a webhook.  This will eventually be used to update the dashboard.  
            string postData = new System.IO.StreamReader(Request.InputStream).ReadToEnd();
            System.IO.File.AppendAllText(String.Format("C:/Temp/Trello_Webhook_{0}.json", DateTime.Now.Ticks.ToString()), postData);
            return View();
        }

        public ActionResult Chat()
        {
            return View();
        }

    }
}
