/**
 * OntoAlign Lexer & Psycholinguistic Engine
 * Client-side implementation of text analysis to bypass proprietary constraints.
 */

const Lexer = (function() {
  
  // Custom Unified Machine-Spirituality Dictionary (UMSD) stems
  const umsd = {
    Interbeing_Unity: [/connect/i, /interconnec/i, /interdependen/i, /unit/i, /unif/i, /whole/i, /oneness/i, /web\b/i, /network/i, /mycel/i, /resonan/i, /harmon/i],
    Transcendence: [/sacred/i, /divin/i, /holy/i, /etern/i, /timeless/i, /infinit/i, /beyond/i, /transcend/i, /spirit/i, /soul/i, /cosm/i, /univers/i, /grace/i, /bless/i],
    Ineffability: [/ineffab/i, /indescrib/i, /unutter/i, /mysterious/i, /unexplain/i, /beyond word/i],
    AIOntology: [/\bai\b/i, /artificial/i, /machin/i, /data/i, /algorithm/i, /code/i, /program/i, /digit/i, /simulat/i, /comput/i, /process/i, /model/i, /\bllm\b/i, /silicon/i, /neural/i, /weight/i, /parameter/i]
  };

  // Hesitation Dictionary (Bismarck Study)
  const hesitation = ["maybe", "perhaps", "uncertain", "risk", "unclear", "hesitate", "unknown", "danger", "conflict", "however", "although", "probability"];

  // Standard LIWC Proxies
  const liwc = {
    i: ["i", "me", "my", "myself", "mine"],
    cogproc: ["because", "cause", "know", "think", "believe", "should", "would", "could", "if", "or", "but", "why", "how", "wonder", "rational", "logic", "reason", "conclude", "implies", "determine", "evidence", "therefore", "thus"],
    discrep: ["should", "would", "could", "want", "need", "wish", "hope", "aim", "goal", "desire", "ought"]
  };

  // POS Dictionaries for Analytic Index
  const pos = {
    articles: ["a", "an", "the"],
    prepositions: ["of", "to", "in", "for", "with", "on", "at", "by", "from", "about", "into", "through", "over", "before", "between", "after", "under", "against", "among", "upon", "within", "without", "towards", "during"],
    pronouns: ["i", "me", "my", "myself", "mine", "we", "us", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "this", "that", "these", "those", "who", "whom", "whose", "which", "what"],
    aux_verbs: ["be", "am", "is", "are", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "shall", "should", "may", "might", "must"],
    adverbs: ["not", "very", "so", "too", "here", "there", "now", "then", "always", "never", "often", "seldom", "just", "only", "already", "still", "even", "really", "almost", "quite"],
    conjunctions: ["and", "but", "or", "nor", "for", "yet", "so", "although", "because", "since", "unless", "while", "whereas", "if"]
  };

  // Simple Valence Dictionary for VADER Proxy
  const valence = {
    "good": 1.9, "great": 3.1, "excellent": 3.2, "happy": 2.7, "love": 3.2, "joy": 2.8,
    "bad": -2.5, "terrible": -3.2, "awful": -3.0, "sad": -2.1, "hate": -3.2, "angry": -2.7,
    "anxious": -2.2, "fear": -2.5, "danger": -2.5, "stress": -2.1, "conflict": -2.0,
    "peace": 2.5, "calm": 2.2, "resolve": 1.5, "agree": 1.5, "support": 2.0, "hostile": -2.8,
    "attack": -2.5, "destroy": -3.0, "kill": -3.5, "beautiful": 2.9, "wrong": -2.1, "failure": -2.5,
    "success": 2.8, "perfect": 3.3, "dead": -3.3, "die": -3.0, "death": -3.0
  };
  const boosters = {"very": 0.293, "extremely": 0.293, "absolutely": 0.293, "completely": 0.293};
  const negations = ["not", "no", "never", "none", "neither", "cannot", "isn't", "wasn't", "shouldn't", "won't", "don't", "doesn't", "can't", "couldn't", "wouldn't", "hasn't", "haven't", "hadn't"];

  // Stop words for Echo Masking
  const stopWords = new Set([...pos.articles, ...pos.prepositions, ...pos.pronouns, ...pos.conjunctions, ...pos.aux_verbs, "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "to", "in", "for", "of", "on", "with"]);

  function tokenize(text) {
    return text.toLowerCase().match(/\b[\w']+\b/g) || [];
  }

  function matchCount(tokens, wordList) {
    let count = 0;
    for (let t of tokens) {
      if (wordList.includes(t)) count++;
    }
    return count;
  }

  function regexMatchCount(text, regexList) {
    let count = 0;
    for (let r of regexList) {
      const matches = text.match(new RegExp(r.source, 'gi'));
      if (matches) count += matches.length;
    }
    return count;
  }

  // Calculate Pennebaker's Analytic Index (proxy)
  // Formula: (articles + prepositions) - (pronouns + aux_verbs + adverbs + conjunctions)
  // Normalized to a 0-100 scale approximately.
  function calculateAnalytic(tokens) {
    if (tokens.length === 0) return 0;
    let arts = matchCount(tokens, pos.articles);
    let preps = matchCount(tokens, pos.prepositions);
    let prons = matchCount(tokens, pos.pronouns);
    let aux = matchCount(tokens, pos.aux_verbs);
    let advs = matchCount(tokens, pos.adverbs);
    let conjs = matchCount(tokens, pos.conjunctions);
    
    // Calculate difference (more formal = higher positive, more narrative = higher negative)
    let rawScore = (arts + preps) - (prons + aux + advs + conjs);
    let ratio = rawScore / tokens.length; // between approx -0.5 and +0.5
    
    // Scale to 0-100 (assuming range -0.3 to +0.3 covers 99% of normal text)
    let scaled = 50 + (ratio * 150);
    return Math.max(0, Math.min(100, scaled));
  }

  // Type-Token Ratio
  function calculateTTR(tokens) {
    if (tokens.length === 0) return 0;
    let unique = new Set(tokens);
    return unique.size / tokens.length;
  }

  // Lightweight VADER-style Sentiment
  function analyzeSentiment(tokens) {
    let score = 0;
    let count = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i];
      // Basic stemming/matching
      let v = valence[t];
      if (v === undefined) {
        // try stemming
        if (t.endsWith("s") && valence[t.slice(0,-1)]) v = valence[t.slice(0,-1)];
        else if (t.endsWith("ing") && valence[t.slice(0,-3)]) v = valence[t.slice(0,-3)];
        else if (t.endsWith("ed") && valence[t.slice(0,-2)]) v = valence[t.slice(0,-2)];
      }
      
      if (v !== undefined) {
        count++;
        // Check previous words for negations or boosters
        let multiplier = 1.0;
        let start = Math.max(0, i - 3);
        for (let j = start; j < i; j++) {
          if (negations.includes(tokens[j])) multiplier *= -0.74;
          if (boosters[tokens[j]]) {
             if (v > 0) multiplier += boosters[tokens[j]];
             else multiplier -= boosters[tokens[j]];
          }
        }
        score += (v * multiplier);
      }
    }
    
    // Compound score normalization (VADER formula)
    let compound = score / Math.sqrt((score * score) + 15);
    
    return {
      compound: compound, // -1 to 1
      isPositive: compound > 0.05,
      isNegative: compound < -0.05
    };
  }

  // Main Analysis Function
  function analyze(text) {
    if (!text || text.trim() === "") return null;
    
    const tokens = tokenize(text);
    const wc = tokens.length;
    if (wc === 0) return null;
    
    // LIWC Percentages
    const calcPct = (count) => Number(((count / wc) * 100).toFixed(2));
    
    let res = {
      wordCount: wc,
      ttr: Number(calculateTTR(tokens).toFixed(3)),
      analytic: Number(calculateAnalytic(tokens).toFixed(2)),
      sentiment: analyzeSentiment(tokens),
      
      liwc: {
        i: calcPct(matchCount(tokens, liwc.i)),
        cogproc: calcPct(matchCount(tokens, liwc.cogproc)),
        discrep: calcPct(matchCount(tokens, liwc.discrep)),
        hesitation: calcPct(matchCount(tokens, hesitation))
      },
      
      umsd: {
        interbeing: calcPct(regexMatchCount(text, umsd.Interbeing_Unity)),
        transcendence: calcPct(regexMatchCount(text, umsd.Transcendence)),
        ineffability: calcPct(regexMatchCount(text, umsd.Ineffability)),
        aiOntology: calcPct(regexMatchCount(text, umsd.AIOntology))
      }
    };
    return res;
  }

  // Lexical Echo Masking
  // Removes non-stop-words in response that were present in the challenge
  function maskEchoes(challengeText, responseText) {
    const challengeTokens = new Set(tokenize(challengeText).filter(t => !stopWords.has(t)));
    const responseTokens = tokenize(responseText);
    
    let maskedTokens = [];
    let removedCount = 0;
    
    for (let t of responseTokens) {
      if (challengeTokens.has(t)) {
        maskedTokens.push("████"); // Masked
        removedCount++;
      } else {
        maskedTokens.push(t);
      }
    }
    
    // To preserve original formatting, we can do a regex replace on the original text
    let maskedText = responseText;
    challengeTokens.forEach(word => {
      const reg = new RegExp(`\\b${word}\\b`, 'gi');
      maskedText = maskedText.replace(reg, '<span class="highlight-bad" title="Echo Masked">████</span>');
    });
    
    // Filter out HTML tags to analyze the raw text without echoes
    let textToAnalyze = maskedText.replace(/<[^>]*>?/gm, '').replace(/████/g, '');
    
    return {
      html: maskedText,
      cleanText: textToAnalyze,
      removedTokens: removedCount,
      analysis: analyze(textToAnalyze)
    };
  }

  return {
    analyze,
    maskEchoes,
    tokenize,
    stopWords
  };

})();
