const vscode = require('vscode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

function activate(context) {
  const tools = [
    { label: 'UUID 生成', command: 'devtools.generateUUID' },
    { label: 'Base64 编码', command: 'devtools.base64Encode' },
    { label: 'Base64 解码', command: 'devtools.base64Decode' },
    { label: '字符串 MD5', command: 'devtools.hash.md5' },
    { label: '字符串 SHA1', command: 'devtools.hash.sha1' },
    { label: '字符串 SHA256', command: 'devtools.hash.sha256' },
    { label: '正则表达式测试', command: 'devtools.regexTester' },
    { label: 'JSON 格式化', command: 'devtools.jsonFormat' },
  ];

  const treeDataProvider = new (class {
    getTreeItem(element) {
      const item = new vscode.TreeItem(element.label);
      item.command = { command: element.command, title: element.label };
      item.contextValue = 'tool';
      return item;
    }
    getChildren() {
      return tools;
    }
  })();

  vscode.window.registerTreeDataProvider('devtools.general', treeDataProvider);

  // 以下注册命令与之前相同
  context.subscriptions.push(
    vscode.commands.registerCommand('devtools.generateUUID', () => {
		const uuid = uuidv4();
		vscode.env.clipboard.writeText(uuid);
		vscode.window.showInformationMessage(`UUID 已复制: ${uuid}`, { modal: true });
	  }),
    vscode.commands.registerCommand('devtools.base64Encode', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const text = editor.document.getText(editor.selection);
        const encoded = Buffer.from(text).toString('base64');
        editor.edit(edit => edit.replace(editor.selection, encoded));
      }
    }),
    vscode.commands.registerCommand('devtools.base64Decode', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const text = editor.document.getText(editor.selection);
        try {
          const decoded = Buffer.from(text, 'base64').toString();
          editor.edit(edit => edit.replace(editor.selection, decoded));
        } catch (err) {
          vscode.window.showErrorMessage('Base64 解码失败');
        }
      }
    }),
    vscode.commands.registerCommand('devtools.hash.md5', () => hashText('md5')),
    vscode.commands.registerCommand('devtools.hash.sha1', () => hashText('sha1')),
    vscode.commands.registerCommand('devtools.hash.sha256', () => hashText('sha256')),
    vscode.commands.registerCommand('devtools.regexTester', () => {
      const panel = vscode.window.createWebviewPanel('regexTester', '正则表达式测试', vscode.ViewColumn.One, { enableScripts: true });
      panel.webview.html = getRegexHtml();
    }),
    // vscode.commands.registerCommand('devtools.jsonFormat', () => {
    //   const editor = vscode.window.activeTextEditor;
    //   if (editor) {
    //     const text = editor.document.getText(editor.selection);
    //     try {
    //       const formatted = JSON.stringify(JSON.parse(text), null, 2);
    //       editor.edit(edit => edit.replace(editor.selection, formatted));
    //     } catch (e) {
    //       vscode.window.showErrorMessage('JSON 格式错误');
    //     }
    //   }
    // }),
	vscode.commands.registerCommand('devtools.jsonFormat', () => {
		const panel = vscode.window.createWebviewPanel(
		'jsonFormat',
		'JSON 格式化工具',
		vscode.ViewColumn.One,
		{ enableScripts: true }
		);
	
		panel.webview.html = getJsonFormatHtml();
	}),
  );  
  function hashText(algo) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const text = editor.document.getText(editor.selection);
      const hashed = crypto.createHash(algo).update(text).digest('hex');
      editor.edit(edit => edit.replace(editor.selection, hashed));
    }
  }
}

function getJsonFormatHtml() {
	return `<!DOCTYPE html>
  <html lang="zh">
  <head>
	<meta charset="UTF-8" />
	<style>
	  body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		margin: 0;
		padding: 20px;
		background-color: #f8f8f8;
		color: #333;
	  }
	  h3 {
		text-align: center;
		color: #007acc;
	  }
	  .top-bar {
		text-align: center;
		margin-bottom: 10px;
	  }
	  button {
		background-color: #007acc;
		color: white;
		padding: 6px 14px;
		font-size: 14px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	  }
	  button:hover {
		background-color: #005f99;
	  }
	  .container {
		display: flex;
		height: 500px;
		border: 1px solid #ccc;
		border-radius: 6px;
		overflow: hidden;
	  }
	  textarea, pre {
		width: 50%;
		height: 100%;
		padding: 10px;
		font-family: monospace;
		font-size: 14px;
		border: none;
		box-sizing: border-box;
		resize: none;
	  }
	  textarea {
		background-color: #ffffff;
		border-right: 1px solid #ccc;
	  }
	  pre {
		background-color: #f4f4f4;
		margin: 0;
		overflow: auto;
		white-space: pre-wrap;
	  }
	  .copy-bar {
		text-align: right;
		padding: 5px 0;
	  }
	  #error {
		color: red;
		font-weight: bold;
		padding: 10px;
	  }
	</style>
  </head>
  <body>
	<h3>JSON 格式化工具</h3>
  
	<div class="top-bar">
	  <button id="formatBtn">格式化 JSON</button>
	</div>
  
	<div class="container">
	  <textarea id="jsonInput" placeholder="请输入 JSON..."></textarea>
	  <div style="width:50%; display: flex; flex-direction: column;">
		<div class="copy-bar">
		  <button id="copyBtn">复制</button>
		</div>
		<pre id="result">（点击“格式化 JSON”后显示结果）</pre>
	  </div>
	</div>
  
	<script>
	  const input = document.getElementById('jsonInput');
	  const result = document.getElementById('result');
	  const formatBtn = document.getElementById('formatBtn');
	  const copyBtn = document.getElementById('copyBtn');
  
	  formatBtn.addEventListener('click', () => {
		try {
		  const json = JSON.parse(input.value);
		  result.textContent = JSON.stringify(json, null, 2);
		} catch (e) {
		  result.textContent = '格式化失败，请检查文本';
		}
	  });
  
	  copyBtn.addEventListener('click', () => {
		const text = result.textContent;
		if (text && text !== '格式化失败，请检查文本') {
		  navigator.clipboard.writeText(text);
		  alert('格式化结果已复制');
		}
	  });
	</script>
  </body>
  </html>`;
  }
  
  

function getRegexHtml() {
	return `<!DOCTYPE html>
  <html lang="zh">
  <head>
	<meta charset="UTF-8" />
	<style>
	  body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		margin: 20px;
		background-color: #f8f8f8;
		color: #333;
	  }
	  h3 {
		color: #007acc;
	  }
	  label {
		font-weight: bold;
		margin-top: 10px;
		display: block;
	  }
	  input[type="text"], textarea, button {
		width: 100%;
		padding: 8px;
		margin-top: 5px;
		margin-bottom: 15px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
		box-sizing: border-box;
	  }
	  .options {
		margin-bottom: 15px;
	  }
	  .options label {
		display: inline-block;
		margin-right: 10px;
		font-weight: normal;
	  }
	  button {
		background-color: #007acc;
		color: white;
		cursor: pointer;
		font-weight: bold;
		transition: background 0.3s;
	  }
	  button:hover {
		background-color: #005f99;
	  }
	  pre {
		background: #f4f4f4;
		padding: 10px;
		border-radius: 4px;
		white-space: pre-wrap;
		border: 1px solid #ccc;
	  }
	  .error {
		color: red;
		font-weight: bold;
		margin-bottom: 10px;
	  }
	  mark {
		background-color: yellow;
		font-weight: bold;
	  }
	</style>
  </head>
  <body>
	<h3>正则表达式测试工具</h3>
  
	<label for="regex">正则表达式：</label>
	<input id="regex" type="text" placeholder="请输入正则表达式，例如：\\d+" />
  
	<div class="options">
	  <label><input type="checkbox" id="flag-g" checked /> 全局 (g)</label>
	  <label><input type="checkbox" id="flag-i" /> 忽略大小写 (i)</label>
	  <label><input type="checkbox" id="flag-m" /> 多行 (m)</label>
	</div>
  
	<label for="text">测试文本：</label>
	<textarea id="text" rows="5" placeholder="请输入你想测试的文本..."></textarea>
  
	<button id="matchBtn">执行匹配</button>
  
	<div id="error" class="error" style="display:none;"></div>
  
	<label for="result">匹配结果：</label>
	<pre id="result">（点击上方按钮后显示结果）</pre>
  
	<script>
	  const regexInput = document.getElementById('regex');
	  const textInput = document.getElementById('text');
	  const resultOutput = document.getElementById('result');
	  const errorDiv = document.getElementById('error');
	  const matchBtn = document.getElementById('matchBtn');
  
	  const flagG = document.getElementById('flag-g');
	  const flagI = document.getElementById('flag-i');
	  const flagM = document.getElementById('flag-m');
  
	  matchBtn.addEventListener('click', () => {
		errorDiv.style.display = 'none';
		resultOutput.innerHTML = '';
		try {
		  const flags = (flagG.checked ? 'g' : '') +
						(flagI.checked ? 'i' : '') +
						(flagM.checked ? 'm' : '');
  
		  const regex = new RegExp(regexInput.value, flags);
		  const text = textInput.value;
  
		  let match;
		  let lastIndex = 0;
		  let resultHtml = '';
  
		  while ((match = regex.exec(text)) !== null) {
			const matchText = match[0];
			const start = match.index;
			const end = start + matchText.length;
  
			resultHtml += escapeHtml(text.slice(lastIndex, start));
			resultHtml += '<mark>' + escapeHtml(matchText) + '</mark>';
			lastIndex = end;
  
			if (match.index === regex.lastIndex) regex.lastIndex++;
		  }
  
		  resultHtml += escapeHtml(text.slice(lastIndex));
		  resultOutput.innerHTML = resultHtml || '无匹配';
		} catch (e) {
		  errorDiv.style.display = 'block';
		  errorDiv.textContent = '正则错误：' + e.message;
		}
	  });
  
	  function escapeHtml(str) {
		return str.replace(/[&<>"']/g, tag => ({
		  '&': '&amp;',
		  '<': '&lt;',
		  '>': '&gt;',
		  '"': '&quot;',
		  "'": '&#39;'
		}[tag]));
	  }
	</script>
  </body>
  </html>`;
  }
  

  

function deactivate() {}

module.exports = { activate, deactivate };
