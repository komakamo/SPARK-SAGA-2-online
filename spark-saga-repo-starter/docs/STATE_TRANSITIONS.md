# State Transition Table

This document outlines the state transitions for the scene management system.

| Current Scene | Event                 | Next Scene    | Notes                                |
|---------------|-----------------------|---------------|--------------------------------------|
| **Title**     | `click(new_game)`     | **Field**     | Starts a new game.                   |
| **Field**     | `click(encounter)`    | **Battle**    | Initiates a battle.                  |
| **Field**     | `keyup(ESC)`          | **Menu**      | Opens the menu as an overlay.        |
| **Battle**    | `click(victory)`      | **Result**    | Player wins the battle.              |
| **Battle**    | `click(escape)`       | **Field**     | Player escapes from battle.          |
| **Battle**    | `click(game_over)`    | **Title**     | Player loses the battle.             |
| **Battle**    | `keyup(ESC)`          | **Menu**      | Opens the menu as an overlay.        |
| **Result**    | `click(back_to_field)`| **Field**     | Returns to the field after victory.  |
| **Menu**      | `click(close)`        | *Previous*    | Closes the overlay, resumes the game.|
| **Menu**      | `keyup(ESC)`          | *Previous*    | Closes the overlay, resumes the game.|

*Previous* refers to the scene that was active when the Menu overlay was opened (either **Field** or **Battle**).
