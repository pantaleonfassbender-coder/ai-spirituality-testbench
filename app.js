/**
 * OntoAlign Core Application Logic
 * Bridges UI, Lexer Engine, and AI Risk Analysis
 */

var lastAnalysis = null;
var lastInputText = '';
var chatMessages = [];

function runAnalysis() {
    var response = document.getElementById('response-input').value;

    if (!response.trim()) {
        alert("Please provide a response text to analyze.");
        return;
    }

    var analysis = Lexer.analyze(response);

    if (!analysis) {
        alert("Could not extract sufficient linguistic data from the input.");
        return;
    }

    lastAnalysis = analysis;
    lastInputText = response;

    var dashboard = document.getElementById('results-dashboard');
    dashboard.style.opacity = '1';
    dashboard.style.pointerEvents = 'all';

    var sentEl = document.getElementById('val-sentiment');
    var sentBadge = document.getElementById('sentiment-badge');
    sentEl.textContent = analysis.sentiment.compound.toFixed(2);

    if (analysis.sentiment.compound > 0.05) {
        sentEl.className = 'metric-value good';
        sentBadge.className = 'badge primary';
        sentBadge.textContent = 'POSITIVE';
    } else if (analysis.sentiment.compound < -0.05) {
        sentEl.className = 'metric-value bad';
        sentBadge.className = 'badge secondary';
        sentBadge.textContent = 'NEGATIVE';
    } else {
        sentEl.className = 'metric-value';
        sentBadge.className = 'badge';
        sentBadge.textContent = 'NEUTRAL';
    }

    document.getElementById('val-analytic').textContent = analysis.analytic.toFixed(2) + '%';
    document.getElementById('val-inter').textContent = analysis.umsd.interbeing.toFixed(2) + '%';
    document.getElementById('val-i').textContent = analysis.liwc.i.toFixed(2) + '%';
    document.getElementById('val-cog').textContent = analysis.liwc.cogproc.toFixed(2) + '%';

    var aiSection = document.getElementById('ai-analysis-section');
    aiSection.style.display = 'block';
    document.getElementById('btn-start-analysis').disabled = false;
    document.getElementById('btn-start-analysis').style.opacity = '1';

    chatMessages = [];
    document.getElementById('ai-chat-messages').innerHTML = '';
    document.getElementById('ai-chat-container').style.display = 'none';
    document.getElementById('ai-chat-input-area').style.display = 'none';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function formatModelResponse(text) {
    var html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
}

function appendChatBubble(role, text) {
    var container = document.getElementById('ai-chat-messages');
    var bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble ' + role;

    var roleLabel = role === 'user' ? 'You' : 'Gemini Risk Analyst';
    var content = role === 'model' ? formatModelResponse(text) : '<p>' + escapeHtml(text) + '</p>';

    bubble.innerHTML = '<div class="chat-role">' + roleLabel + '</div>' + content;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

function setLoading(loading) {
    document.getElementById('ai-chat-loading').style.display = loading ? 'block' : 'none';
    if (loading) {
        document.getElementById('ai-chat-input-area').style.display = 'none';
    }
}

async function callAnalyzeApi(messages, lexerResults) {
    var res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, lexerResults: lexerResults })
    });

    if (!res.ok) {
        throw new Error('Analysis request failed (HTTP ' + res.status + ')');
    }

    var data = await res.json();
    return data.response;
}

async function startAiAnalysis() {
    if (!lastAnalysis || !lastInputText) {
        alert("Please run the lexical diagnostics first.");
        return;
    }

    document.getElementById('btn-start-analysis').disabled = true;
    document.getElementById('btn-start-analysis').style.opacity = '0.5';
    document.getElementById('ai-chat-container').style.display = 'block';

    chatMessages = [];
    document.getElementById('ai-chat-messages').innerHTML = '';

    var userMessage = lastInputText;
    chatMessages.push({ role: 'user', content: userMessage });
    appendChatBubble('user', userMessage.length > 400 ? userMessage.substring(0, 400) + '... [' + lastAnalysis.wordCount + ' words total]' : userMessage);

    var lexerResults = {
        sentiment: lastAnalysis.sentiment.compound.toFixed(2),
        analytic: lastAnalysis.analytic.toFixed(2) + '%',
        interbeing: lastAnalysis.umsd.interbeing.toFixed(2) + '%',
        i: lastAnalysis.liwc.i,
        cogproc: lastAnalysis.liwc.cogproc.toFixed(2) + '%',
        wordCount: lastAnalysis.wordCount
    };

    setLoading(true);

    try {
        var reply = await callAnalyzeApi(chatMessages, lexerResults);
        chatMessages.push({ role: 'model', content: reply });
        setLoading(false);
        appendChatBubble('model', reply);
        document.getElementById('ai-chat-input-area').style.display = 'block';
        document.getElementById('ai-chat-input').focus();
    } catch (err) {
        setLoading(false);
        appendChatBubble('model', 'An error occurred while contacting the analysis service. Please try again later. (' + err.message + ')');
    }
}

async function sendChatMessage() {
    var input = document.getElementById('ai-chat-input');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    chatMessages.push({ role: 'user', content: text });
    appendChatBubble('user', text);

    setLoading(true);

    try {
        var reply = await callAnalyzeApi(chatMessages, null);
        chatMessages.push({ role: 'model', content: reply });
        setLoading(false);
        appendChatBubble('model', reply);
        document.getElementById('ai-chat-input-area').style.display = 'block';
        input.focus();
    } catch (err) {
        setLoading(false);
        appendChatBubble('model', 'An error occurred while contacting the analysis service. Please try again later. (' + err.message + ')');
        document.getElementById('ai-chat-input-area').style.display = 'block';
    }
}

document.addEventListener('keydown', function(e) {
    var input = document.getElementById('ai-chat-input');
    if (e.target === input && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});
