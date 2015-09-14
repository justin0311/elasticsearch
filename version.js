/**
 * Module dependencies.
 */
var config = global.config;

exports.getVersion = function(req, res) {

    var result  = {
        build: 1008,
        version: "4.0.12"
    };

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(result);
}

exports.getChangelog = function(req, res){

    var changelog  = [
        {build: 1008, version: "4.0.12", date: "2015-05-14", changelog: [
            "Improvement: Performance improvements - uses compression and excludes histogram to carousel"
        ]},
        {build: 1008, version: "4.0.11", date: "2015-05-14", changelog: [
            "Improvement: Now uses 100 images per screen in search and batch pages"
        ]},
        {build: 1008, version: "4.0.10", date: "2015-05-04", changelog: [
            "Bug fix: Fixed bug where batch stats wouldn't updated on batch approve"
        ]},
        {build: 1008, version: "4.0.9", date: "2015-04-30", changelog: [
            "Bug fix: Fixed bug with scrolling and navigation",
            "Bug fix: Fixed bug occurring when displaying images locked by someone else",
            "Improvement: Added better scripts to start/stop/upgrade Tom"
        ]},
        {build: 1008, version: "4.0.8", date: "2015-04-27", changelog: [
            "Bug fix: Fixed bug where total count in search page wouldn't update if not using progress meter"
        ]},
        {build: 1008, version: "4.0.7", date: "2015-04-27", changelog: [
            "Improvement: Added possibility to set limit on number of batches to show in batchstats"
        ]},
        {build: 1008, version: "4.0.6", date: "2015-04-25", changelog: [
            "Bug fix: Fixed bug where correcting image would flicker",
            "Bug fix: Now registers total count of images in batch stats",
            "Bug fix: Fixed total update count when not using progressmeter",
            "Bug fix: Fixed bug where cmd key on mac would interfer with tagging using keyboard shortcuts"
        ]},
        {build: 1008, version: "4.0.5", date: "2015-04-24", changelog: [
            "Improvement: Now dynamically loads client config parameters",
            "Improvement: Now possible to disable some functions in server config",
            "Improvement: Added client side http timeout parameter"
        ]},
        {build: 1008, version: "4.0.4", date: "2015-04-24", changelog: [
            "Bug fix: Disabled pie chart due to performance reasons",
            "Improvement: Refactored filter queries to improve use of indexes, for performance reasons"
        ]},
        {build: 1008, version: "4.0.3", date: "2015-04-23", changelog: [
            "Bug fix: Now handles search/batchstats of &lt;none&gt;"
        ]},
        {build: 1008, version: "4.0.2", date: "2015-04-17", changelog: [
            "Improvement: Title on all pages",
            "Bug fix: Batch selection in search page does not reset",
            "Bug fix: Mouse wheel now scrolls in same direction as v3",
            "Bug fix: Now shows correct error message when loading images fail"
        ]},
        {build: 1008, version: "4.0.1", date: "2015-04-08", changelog: [
            "Bug fix: Fixed bug with locked property"
        ]},
        {build: 1008, version: "4.0.0", date: "2015-04-08", changelog: [
            "Improvement: Rewrote big parts of Tom and split to several files",
            "Improvement: Made client code partly jslint compliant"
        ]},
        {build: 1008, version: "3.4.4", date: "2015-03-09", changelog: [
            "Improvement: Removed RFC functionality to increase performance"
        ]},
        {build: 1007, version: "3.4.3", date: "2015-03-06", changelog: [
            "Bug fix: Fix for some images in a property that wasn't saved",
            "Bug fix: Added check for saves that are in progress",
            "Bug fix: Checks if property exists before setting active",
            "Bug fix: Small fix for pie chart on index page",
            "Improvement: Dotted line around item means pending save"
        ]},
        {build: 1007, version: "3.4.2", date: "2014-12-18", changelog: [
            "Improvement: Improved parallell tagging by semaphore implementation"
        ]},
        {build: 1007, version: "3.4.1", date: "2014-11-11", changelog: [
            "New feature: Added pagination support for batch management"
        ]},
        {build: 1006, version: "3.4.0", date: "2014-10-27", changelog: [
            "New feature: Added user management"
        ]},
        {build: 1006, version: "3.3.1", date: "2014-09-25", changelog: [
            "New feature: Added batch reports",
            "New feature: Added batch management",
            "New feature: New user role 'admin', supported by batch management page",
            "Improvement: Only admin users can see corrected images in carousel",
            "Improvement: Only non-admins can scroll through images with the scroll wheel in carousel",
            "Improvement: Batch reports now uses cached data",
            "Improvement: Improved module handling between node modules",
            "Improvement: Improved starting page icons",
            "Improvement: Space bar now saves in carousel page",
            "Improvement: When scrolling in carousel page, now skips the 'house' icon",
            "Bug fix: Support for properties with images from multiple batches",
            "Bug fix: Silenced alert message when image was already locked",
            "Bug fix: Now scrolls to top when changing page"
        ]},
        {build: 1005, version: "3.2.5", date: "2014-07-16", changelog: [
            "New feature: Pagination instead of infinite scroll",
            "Improvement: Now defaults to AND filter behaviour",
            "Bugfix: Now handles attributes with a '-' in the name",
            "Bugfix: Now releases lock properly after all images have been tagged",
            "Bugfix: Handles numeric shortcuts correctly",
            "Bugfix: Fixed toggle message of boolean attributes"
        ]},
        {build: 1005, version: "3.2.4", date: "2014-06-24", changelog: [
            "New feature: Added 'perfapp' to be able to simulate a number of simultaneous users for performance",
            "Improvement: Much improved support for simultaneous users",
            "Improvement: Much improved automatic tests",
            "Improvement: Changed to new config structure",
            "Improvement: Now ignores the isSkip element",
            "Bugfix: Now uses new color tag when filtering",
            "Bugfix: API now shows images locked properly"
        ]},
        {build: 1005, version: "3.2.3", date: "2014-06-05", changelog: [
            "New feature: Search page now filters on \"rfc\" and \"corrected\". Browse page now filters on \"locked\"",
            "Update: Added workaround for broken iPhone RFC behaviour. Now filters correctly by RFC on search page",
            "Update: Search page now displays number of total images as well as number of tagged. If a batch is chosen, number are batch-relative",
            "Update: Batch selector was moved to top since its now a more 'powerful' selector",
            "Update: Search and browse pages upgraded from bootstrap 2.3.2 to bootstrap 3.1.",
            "Update: Other pages except tag updated from bootstrap 3.0 to 3.1",
            "Bugfix: Now disables bootstrap-switches correctly on search page",
            "Bugfix: Fix where eternal loop could be created when loading images in search page which were broken",
            "Bugfix: Popover window in search page could display at wrong size and location, especially with image size bigger than screen"
        ]},
            {build: 1004, version: "3.2.2", date: "2014-05-28", changelog: [
            "Isotope grid component replace with own component"
        ]},
        {build: 1004, version: "3.2.1", date: "2014-05-27", changelog: [
            "New feature: Shows summary of tags on carousel page",
            "Update: Server side color thieving implemented in carousel and tag page",
            "Update: Increased num preloaded images in carousel page",
            "Update: Improved way of saving tags in \"correct mode\"",
            "Bugfix: Fixed some bugs with carousel page"
        ]},
        {build: 1004, version: "3.2.0", date: "2014-05-21", changelog: [
            "New feature: Carousel tagging page. Search/browse pages now link to carousel page instead of tagging page.",
            "New feature: Ability to leave \"request for correction\" through search page. Carousel shows a users correction requests first.",
            "New feature: Ability to unlock locked images in browse page",
            "Update: Search page has more filters - taggedby and batch",
            "Update: Report page has a new report type, \"corrections done\"",
            "Update: Report page has trend line for the \"team\" report",
            "Update: All pages have common color coding for image states. Active image now uses dashed border",
            "Bugfix: Lots and lots."
        ]},
        {build: 1003, version: "3.1.0", date: "2014-04-23", changelog: [
            "New feature: Tracks corrections done to images with date and username",
            "New feature: Statistics page with 4 reports"
        ]},
        {build: 1002, version: "3.0.0", date: "2014-04-01", changelog: [
            "Recreated project from scratch using passport for user authentication",
            "Web pages for logging in, creating users and accessing parts of tom. Requires logged in user for tom access.",
            "Stores logged in username with each image tag",
            "'Next image' is per default the next unlocked image <b>or</b> the next image already locked by you. Will keep no locked images to a minimum.",
            "Allows to re-tag images locked by you",
            "Shows who has locked an image in search view",
            "Checks that you have the lock when saving image tag"
        ]},
        {build: 1001, version: "2.0.3", date: "2014-04-09", changelog: [
            "Improved handling on poor connections",
            "Added 'copy tags' feature to single tagging image page",
            "Added 'cache status' progress bar to single tagging image page",
            "Added base64 image server route, and changed client to always fetch images by base64"
        ]},
        {build: 1000, version: "2.0.0", date: "2014-03-25", changelog: [
            "Image rotation and updated cropping tool",
            "Grid image thumbnail size adjustment and fix for larger screens",
            "Search for empty attributes (matches images where an attributes is not set",
            "Image caching - each single image page preloads 5 (configurable) images in the background. Has the same effect as tagging in multiple tabs as Emon was doing. Each new page load should now be almost instantaneous.",
            "Total no images for each search.ejs is now displayed",
            "Real time stats update in grid view, show the number of images tagged since grid was loaded, and shows no tags/hour.",
            "Metadata on mouseover is updated in realtime as images are being tagged",
            "In gridtag view, when images have been tagged, the are removed from the grid in real time",
            "Search by similar color in grid view, and ability to 'find similar image' by color in single page view. Sensitivity adjustable."
        ]}
    ];

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(changelog);
}

