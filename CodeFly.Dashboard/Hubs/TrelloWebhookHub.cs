using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace CodeFly.Dashboard.Hubs
{
    public class TrelloWebhookHub : Hub
    {
        public void Send(string name, string message)
        {
            Clients.All.addNewMessageToPage(name, message);
        }

        public void HandleWebHook(object data)
        {
            Clients.All.handleWebHook(data);
        }

        public void HandleBoardActivity(object data)
        {
            Clients.All.handleBoardActivity(data);
        }

        public void HandleListActivity(object data)
        {
            Clients.All.handleListActivity(data);
        }

        public void HandleCardActivity(object data)
        {
            Clients.All.handleCardActivity(data);
        }
    }
}