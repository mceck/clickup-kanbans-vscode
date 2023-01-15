# Clickup Kanbans

Unofficial extension

## configuration

Use command Clickup>Set token to add the clickup authoriation token or open the extension and insert the token from the inside form

Follow the [official guide](https://clickup.com/api/developer-portal/authentication/) to obtain a Personal token

## usage

Use button on sidebar or command Clickup>Open kanban to open full screen view

![preview](media/docs/preview.png)

#### view mode

![preview](media/docs/view-mode.png)

With this view mode you can open a clickup view

Select the view from the picker than you can filter tasks by assignees

#### filter mode

![preview](media/docs/filter-mode.png)

With this view mode you can filter tasks by assignees and lists

#### save views

![preview](media/docs/save.png)

You can save current configuration clicking on the icon or saving with a new name clicking on the 3 dots

Select saved configurations from the selector that can be opened by clicking on the configuration name on the top left of the screen

## dev

Build the webview in watch mode
`yarn watch`

Than start the extension in debug from vscode (Run->Start debugging or F5)
