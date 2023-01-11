# Clickup Kanbans

Unofficial extension

## configuration

use command Clickup>Set token to add the clickup authoriation token

follow the [official guide](https://clickup.com/api/developer-portal/authentication/) to obtain a Personal token

## usage

use button on sidebar or command Clickup>Open kanban to open full screen view

![preview](media/docs/preview.png)

#### view mode

![preview](media/docs/view-mode.png)

Select a clickup view from the picker
With this view mode you can filter tasks by assignees

#### filter mode

![preview](media/docs/filter-mode.png)

With this view mode you can filter tasks by assignees and lists

#### save views

![preview](media/docs/save.png)

You can save current configuration globally or for the current workspace clicking on the 3 dots

## dev

Build the webview in watch mode
`yarn watch`

Than start the extension in debug from vscode (Run->Start debugging or F5)
