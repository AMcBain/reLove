"use strict";

function ChannelManager (parent, channels, offset)
{
    var views, selector, container, buttons, chatcontainers, lastIndices;
    
    container = document.createElement("div");
    container.className = "channelmanager";
    parent.appendChild(container);

    selector = document.createElement("div");
    selector.className = "channelmanager-selector";
    container.appendChild(selector);
    
    views = [];
    chatcontainers = [];
    lastIndices = [];
    buttons = [];
    for(var i in channels)
    {
        var chat = document.createElement("div");
        chat.className = "channelmanager-chat";
        container.appendChild(chat);

        var button = document.createElement("a");
        button.className = "channelmanager-selector-button";
        button.innerText = channels[i];
        button.addEventListener("click",toggleEvent(i));
        selector.appendChild(button);
        buttons.push(button);
        
        chatcontainers.push(chat);
        
        views.push( new ChatView( chat, channels[i], offset) );
        lastIndices.push(0);
    }
    
    toggle(0);

    function toggleEvent (index)
    {
        return function() { toggle(index); };
    }
    function toggle (index)
    {
        for( var i in chatcontainers )
        {
          chatcontainers[i].style.display = i == index ? "block" : "none";
          buttons[i].className = i == index ? "channelmanager-selector-button selected" : "channelmanager-selector-button";
        }
    }
    this.getChat = function (index)
    {
        return views[index];
    }
    this.getLast = function (index)
    {
        return lastIndices[index];
    }
    this.setLast = function (index, last)
    {
        lastIndices[index] = last;
    }
}
