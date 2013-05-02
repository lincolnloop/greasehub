// ==UserScript==
// @name       Martin's Fancy Github Issues
// @namespace  http://lincolnloop.com
// @version    0.2
// @description  something useful
// @match      https://github.com/*/*/issues*
// @copyright  2013+, You and Me
// @require http://code.jquery.com/jquery-1.9.1.min.js
// @require http://userscripts.org/scripts/source/100842.user.js
// ==/UserScript==

// If there is no 'manage labels' button we don't have permission to add/change
// tags so don't do anything.
if($('#manage-labels').length !== 1) {
    return null;
}

function contentEval(source) {
    if ('function' == typeof source) {
        source = '(' + source + ')();';
    }
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = source;
    document.body.appendChild(script);
    document.body.removeChild(script);
}

contentEval(function() {

    // ------------------------------------------------------------------------------
    var tagsList = [':ready', ':started', ':delivered', ':done', ':rejected'],
        tagButton = {
            ':ready': 'start',
            ':started': 'finish',
            ':done': 'accept',
            ':rejected': 'reject'
        };

    // ------------------------------------------------------------------------------
    function applyGreaseHubButton (key, item) {

        // Don't do anything if this is :done
        if ($(item).hasClass('closed')) {
            return null;
        }

        var currentState,
            currentStateTag,
            nextState,
            issueId = $('.js-issues-list-checkbox', item).val(),
            tagList = [];

        $('.label', item).each(function(key, item) {
            tagList.push($(item).attr('data-name'));
        });




        var ajaxStateChange = function () {
            tagList.push(currentState);

            var data = {
                '_method': 'put',
                'authenticity_token': $('meta[name=csrf-token]').attr('content'),
                'labels[]': tagList,
                'issues[]': issueId
            };

            console.log('tagList', tagList);
            console.log('data', data);
            console.log('labels', data['labels[]']);

            $.post('/lincolnloop/greasehub/issues/label', data);

            return;

        }, resetButton = function () {
            currentState = currentState ? currentState : ':ready';

            // remove existing buttons
            $('.greasehub-trigger', item).remove();

            // insert button
            $('.js-navigation-open', item).after('<a class="greasehub-trigger minibutton '+tagButton[currentState]+'">'+tagButton[currentState]+'</a>');

            // insert reject button
            if (currentState == ':done') {
                $('.greasehub-trigger.accept', item).before('<a class="greasehub-trigger minibutton '+tagButton[':rejected']+'">'+tagButton[':rejected']+'</a>');
            }

            // prepare next state
            switch (currentState) {
                case ':ready':
                    nextState = ':started';
                    break;
                case ':started':
                    nextState = ':done';
                    break;
                default:
                    break;
            }

            // ------------------------------------------------------------------------------
            $('.greasehub-trigger').css({
                'float': 'right',
                'font-size': '11px',
                'line-height': '21px',
                'color': '#fff',
                'text-shadow': '0px 1px 1px black',
                'font-weight': 'bold',
                'margin-left': '15px',
                'text-transform': 'capitalize'
            });

            $('.greasehub-trigger.start').css({
                'background-image': 'linear-gradient(rgb(97, 226, 52), rgb(58, 129, 33))'
            });

            $('.greasehub-trigger.finish').css({
                'background-image': 'linear-gradient(rgb(62, 176, 230), rgb(35, 107, 173))'
            });

            $('.greasehub-trigger.accept').css({
                'background-image': 'linear-gradient(rgb(93, 231, 50), rgb(18, 148, 13))'
            });

            $('.greasehub-trigger.reject').css({
                'background-image': 'linear-gradient(rgb(180, 180, 180), rgb(48, 50, 53))',
                'margin-left': '2px'
            });
        };

        // ------------------------------------------------------------------------------
        $(tagsList).each(function (key, tag) {
            if (currentState) return;
            currentStateTag = $(item).find('.labels [data-name="'+tag+'"]');
            currentState = currentStateTag.length ? tag : undefined;
            currentStateTag.hide();
        });

        $(item).delegate('.greasehub-trigger.start', 'click', function () {
            console.log('.greasehub-trigger.start');
            currentState = nextState;
            resetButton();
            ajaxStateChange();
        });

        $(item).delegate('.greasehub-trigger.finish', 'click', function () {
            console.log('.greasehub-trigger.finish');
            currentState = nextState;
            resetButton();
            ajaxStateChange();
        });

        $(item).delegate('.greasehub-trigger.accept', 'click', function () {
            console.log('.greasehub-trigger.accept');
            // close issue, remove buttons and clear tag
            $('.js-issues-list-checkbox', item).trigger('click');
            setTimeout(function(){ $('.js-issues-list-close').trigger('click'); }, 500);
        });

        $(item).delegate('.greasehub-trigger.reject', 'click', function () {
            console.log('.greasehub-trigger.reject');
            // re*start issue, maybe add a "restart" class/label instead?
            currentState = ':ready';
            resetButton();
            ajaxStateChange();
        });

        resetButton();
    }


    // ------------------------------------------------------------------------------
    function applyGreaseHub() {
        $('.issue-list-group .issue-list-item').each(applyGreaseHubButton);
    }

    $(window.document).on('pjax:complete', function(){
        console.log('pjax:complete');
        applyGreaseHub();
    });

    applyGreaseHub();
});


/*
unsafeWindow.addEventListener('popstate', function(){console.log('popstate');});
unsafeWindow.addEventListener('statechange', function(){console.log('statechange');});
$(unsafeWindow.document).ajaxSuccess(function(){console.log('ajaxSuccess');});
*/