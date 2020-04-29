
injectProperty("group", "name",{
});
injectProperty("group", "contentVisibility",{
    /**
     * always visible
     * always hidden in play mode
     * only visible when including an active signal
     * hidden until an incoming signal reach it (then still visible)

     when a group is hidden all his content is hidden with it.
     if an element is in more than one group, it will be shown if at least one of these group is in visible state.
     */
});
injectProperty("group", "bgVisibility",{
    // default: when visible (contentVisibility)
    // only in edit mode
    // always but scene cam don't resize to it
});
injectProperty("group", "bgColor",{
});
