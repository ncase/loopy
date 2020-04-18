# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Road-map
- Groups
- Camera mode 
- Multi-lang support
- Write documentation pages and examples
- Show hide nodes


## [Unreleased] (by [1000i100])

### Added

##### Edit mode user interface
- a **simple mode** to keep loopy as simple as it used to be (easy onboarding or learning curve). Simple mode include only v1.* features.
- an **advanced mode** to unleash the power of creativity with V2 features.
- add a help shortcut `?` for each features linked to a page with some explanations and use-case examples
- a global switch between **colorAesthetic**  and **colorLogic** mode to allow the use of color to unambiguous different kind of signals and nodes.

##### Death / Life mechanics
- nodes can now die and reborn (by receiving vital change propagation signal or by explosion threshold settings).
- when a node die, it sends (propagate) a death signal to all arrows allowing it.
- when a dead node receives any signal except reborn, it's dropped.
- when a dead node reborn, it sends (propagate) a reborn/life signal to all arrows allowing it.
- when an alive node receives a reborn signal, it's dropped.
- when a dead node receives a death signal, it's dropped.

##### Node advanced features
- empty the name field to resize it to a tiny internal-logic node.
- name it "autoplay" to auto send a signal on start in play-mode.
- 4 node **sizes** with 4 different **storage capacities** (none, normal, x5 and x100)
- **Overflow threshold** : a node can store signals without forwarding them up to a threshold, and down to another threshold (store signals within a threshold window, forward them outside the window).
- **Aggregation latency** : bypass thresholds to store signals for a duration before releasing them merged into one.
- **Death trigger** : choose if a node implode (die) when empty, or explode (die) when full.

##### Arrow advanced features (previously named Edge)
- **Valency** allows you to act on the signal valency : preserve, invert, filter to keep only positive or negative signal, convert any signal to positive or to negative.
- Arrow can be set to randomly allow/drop signals
- Arrow can allow classical signal and/or vital change signal (death/life).
- Arrow can convert signal to vital change signal
- Arrow can handle signal as tendency (legacy default) or quantity (new)

  **Tendency mechanics**
  nothing new here : when a signal reach a node it add it valency to the node stock and the node forward it
  by cloning it on every output arrows (if no threshold or similar new node feature change that).

  **Quantitative mechanics**
  when a signal reach a node it add it valency to the node stock, like in tendency mode.
  But, if at least one output arrow is in quantitative mode,
  all the overflow will be split between quantitative arrows, send and deduce from the node stock.
  AND, all tendency (or vital change converter) arrow will get a fixed value signal.

- Optional custom name (replacing it behavior symbols)
- Display signal timing to go from start node to end node thru this arrow.

##### Text advanced features
- choose the color for each text message in your model (from 7 choices).
- switch text visibility : you can hide some text in play mode to keep them only as reminder for edition.
- link field : bind your text to a web link to make it clickable.

##### ColorLogic mechanics
- When global colorLogic switch is enable, color become significant, and extra features are unlocked.
- A node stock is only updated by color matching signals.
- All nodes behaviors (threshold, latency, death) are only triggered by matching color signals.
- Signals reaching a node with a foreign color will be forwarded except if **Foreign color** is set to drop them.
- Arrow can **filter signals by color** to only allow a specific color.
- Arrow can also **convert a signal color** from one to another.
- Arrow can even convert to a **random color** from the ones allowed by arrows starting from end node.
- A specific arrow can change its end node color : it will **fill node with signal color**
  (signal is destroyed in the process, use another arrow to clone and spread it if you want).

##### Misc ergonomic / under the hood changes
- compact the edition sidebar on small screen.
- combined sliders to be able to change 2 parameters for one main feature (used for nodes thresholds)
- alternative image in sliderWidget depending of the selected option (for better understanding the choice effect)
- dynamic re-labeling feature name depending of selected option
- keep advanced selected setting in simple mode but display warning in the UI
- keep colorLogic selected setting in colorAesthetic mode but display warning in the UI
- added `json export` to export human readable json (old `save to file` now save a compressed file like `save as link` does now)
- added `load from url` to explain how to include in link an external loopy data file.

### Changed
- **save as link** now store data in binary with lzma compression then base64 conversion.
- **load from file** (or from url) understand the legacy json format and the new compressed one (and the new human readable json format).
- arrows polarity + / - are ignored in advanced mode to let space for the more complete sign Behavior features.
- node text now have a white halo to improve readability.


## [Version 1.1] - 2017-04-11 (by [Nicky Case])
### Added
- save as file, to store your work (system model) in your computer for backup and future improvement (and for big system that don't fit in the url)
- load from file, to load local or downloaded system models.
- make a GIF page to explain how to do gif from loopy with LICEcap or Peek

### Changed
- node amounts are now "uncapped"
- better distribution of "signals"


## [1.0.0] - 2017-02-23  (by [Nicky Case])
### Added

##### Edit mode features
- an edit mode to create your system model.
- a tool bar to pick the tool you want to use
- use ink tool to add system entities to your model
- with ink tool create Node with pencil move
- with ink tool create Arrow/Edge with pencil move between nodes
- use text tool to add some text in your model
- use hand tool to move any part of your model
- use erase tool to delete any part of your model
- use ink or hand tool to select any part of your model and edit it
- a sidebar to view and edit any entity option and display some tips
- in sidebar for nodes, edit name, color and start amount
- in sidebar for edges, switch between positive effect (signal preservation) and negative effect (sgnial inverted)
- in sidebar for texts, edit content text
- in sidebar welcome page: an intro, somes links and import/export features
- save as link, to store your work (system model) in the url and share it easily
- embed in your website, to include the live demo directly in your website
- a play button to switch in play mode

##### Play mode user interface
- a play mode to explore system reactions with moving signals.
- a stop/remix button to switch back in edit mode
- a reset button to start again your simulation from the beginning
- in embed/embedded mode : full screen mode with no sidebar
- a no-UI mode for tiny embed use-case
- an autoplay/autoSendSignal url parameter to start with a moving signal without user action
- a replay mode to discover how to build a system model with loopy just by watching a ghost replay of it.
- auto resize the play scene in full screen / embed mode
- a speed slider to run the simulation (signal speed) slower or faster.

##### Play mode signals features
- as user, by a click, send positive or negative signal from a node
- signals follow arrows to reach next nodes (and change their color to match nodes color)
- signals add/remove theirs values to the node amount then bounce thru arrows
- arrow length changes the delay for a signal to go from a node to another

##### And...
- all other stuff i miss to mention here.


[Unreleased]: https://github.com/1000i100/loopy/compare/v1.1.0...HEAD

[Version 1.1]: https://github.com/1000i100/loopy/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/1000i100/loopy/releases/tag/v0.0.1

[Nicky Case]: https://github.com/ncase "@ncase"
[1000i100]: https://github.com/1000i100 "@1000i100"
