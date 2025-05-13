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
	const timeTools = [
		{ label: '当前时间戳', command: 'devtools.time.timestamp' },
		{ label: '时间戳 ↔ 日期互转', command: 'devtools.timestamp.convert' },
		{ label: 'UTC 时间', command: 'devtools.time.utc' },
	];
	const encodingTools = [
		{ label: 'JSON 转 C++ Class', command: 'devtools.encode.jsonToCpp' },
		{ label: 'JSON 转 Python 接口', command: 'devtools.encode.jsonToPython' },
	];

	const encodingTreeProvider = new (class {
		getTreeItem(element) {
			const item = new vscode.TreeItem(element.label);
			item.command = { command: element.command, title: element.label };
			item.contextValue = 'encodingTool';
			return item;
		}
		getChildren() {
			return encodingTools;
		}
	})();


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
	const timeTreeProvider = new (class {
		getTreeItem(element) {
			const item = new vscode.TreeItem(element.label);
			item.command = { command: element.command, title: element.label };
			item.contextValue = 'timeTool';
			return item;
		}
		getChildren() {
			return timeTools;
		}
	})();
	vscode.window.registerTreeDataProvider('devtools.time', timeTreeProvider);

	vscode.window.registerTreeDataProvider('devtools.general', treeDataProvider);

	vscode.window.registerTreeDataProvider('devtools.coding', encodingTreeProvider);
	//通用工具
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
	//时间工具
	context.subscriptions.push(
		vscode.commands.registerCommand('devtools.time.timestamp', () => {
			const panel = vscode.window.createWebviewPanel(
				'timestampViewer',
				'当前时间戳',
				vscode.ViewColumn.One,
				{ enableScripts: true }
			);

			panel.webview.html = getTimestampWebviewContent();

			// 可选：监听 webview 消息（比如复制到系统剪贴板）
			panel.webview.onDidReceiveMessage(message => {
				if (message.command === 'copy') {
					vscode.env.clipboard.writeText(message.text);
					vscode.window.showInformationMessage('已复制时间戳: ' + message.text);
				}
			});
		}),

		vscode.commands.registerCommand('devtools.timestamp.convert', () => {
			const panel = vscode.window.createWebviewPanel(
				'timestampConvert',
				'时间戳 ↔ 日期互转',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);

			panel.webview.html = getTimestampWebviewHtml();
		}),

		vscode.commands.registerCommand('devtools.time.utc', () => {
			const panel = vscode.window.createWebviewPanel(
				'utcTime',
				'UTC 时间',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);

			panel.webview.html = getUtcWebviewHtml();
		}),
	);
	//编码辅助
	context.subscriptions.push(

		vscode.commands.registerCommand('devtools.encode.jsonToCpp', () => {
			const panel = vscode.window.createWebviewPanel(
				'jsonToCpp',
				'JSON 转 C++ Class',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);

			panel.webview.html = getJsonToCppWebviewHtml();
		}),
		vscode.commands.registerCommand('devtools.encode.jsonToPython', () => {
			const panel = vscode.window.createWebviewPanel(
				'jsonToPython',
				'JSON 转 python 接口',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);

			panel.webview.html = getJsonToPythonWebviewHtml();
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
  <title>JSON 格式化工具</title>
  <style>
    body {
      font-family: "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      margin: 0;
      padding: 30px;
      background: linear-gradient(to right, #e0f7fa, #f0f9ff);
      color: #333;
    }

    h3 {
      text-align: center;
      color: #007acc;
      margin-bottom: 20px;
    }

    .top-bar {
      text-align: center;
      margin-bottom: 16px;
    }

    button {
      background-color: #007acc;
      color: white;
      padding: 8px 18px;
      font-size: 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #005f99;
    }

    .container {
      display: flex;
      height: 500px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(209, 205, 205, 0.636);
      background-color: #ffffff;
    }

    textarea {
      width: 50%;
      padding: 10px;
      font-family: monospace;
      font-size: 14px;
      border: none;
      box-sizing: border-box;
      resize: none;
      outline: none;
      background-color: #ffffff;
      border-right: 1px solid #e0e0e0;
    }

    .output-panel {
      width: 50%;
      display: flex;
      flex-direction: column;
    }

    .copy-bar {
      text-align: right;
      padding: 10px 16px 0;
      background-color: #f7f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .output-panel pre {
      flex: 1;
      background-color: #f7f9fa;
      margin: 0;
      overflow: auto;
      white-space: pre-wrap;
      padding: 10px;
      font-family: monospace;
      font-size: 14px;
      color: red;
      box-sizing: border-box;
    }

    .copy-notice {
      display: none;
      text-align: center;
      background-color: #dff0d8;
      color: #3c763d;
      padding: 10px;
      margin-bottom: 10px;
      font-size: 14px;
      border-radius: 4px;
      width: fit-content;
      margin: 10px auto;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
  </style>
</head>
<body>
  <h3>🌐 JSON 格式化工具</h3>

  <div id="copyNotice" class="copy-notice">已复制到剪贴板!</div>

  <div class="top-bar">
    <button id="formatBtn">格式化 JSON</button>
  </div>

  <div class="container">
    <textarea id="jsonInput" placeholder="请输入 JSON..."></textarea>
    <div class="output-panel">
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
    const copyNotice = document.getElementById('copyNotice');

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
        navigator.clipboard.writeText(text).then(() => {
          copyNotice.textContent = '已复制到剪贴板!';
          copyNotice.style.backgroundColor = '#dff0d8';
          copyNotice.style.color = '#3c763d';
          copyNotice.style.display = 'block';
          setTimeout(() => {
            copyNotice.style.display = 'none';
          }, 2000);
        }).catch(() => {
          copyNotice.textContent = '复制失败，请检查权限';
          copyNotice.style.backgroundColor = '#f2dede';
          copyNotice.style.color = '#a94442';
          copyNotice.style.display = 'block';
          setTimeout(() => {
            copyNotice.style.display = 'none';
          }, 2000);
        });
      }
    });
  </script>
</body>
</html>
`;
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
        .regex-list {
            margin-top: 20px;
        }
        .regex-item {
            margin-bottom: 10px;
        }
        .regex-item button {
            width: auto;
            margin-right: 10px;
            background-color: #5cb85c;
        }
        .regex-item button:hover {
            background-color: #4cae4c;
        }
        .regex-item span {
            font-family: monospace;
            background-color: #f4f4f4;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            max-width: 80%;
            overflow: auto;
            vertical-align: middle;
        }
        .copy-notice {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s;
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

    <div class="regex-list">
        <h3>常用正则表达式</h3>
        <div class="regex-item">
            <button data-regex="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">邮箱验证</button>
            <span>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$</span>
        </div>
        <div class="regex-item">
            <button data-regex="^1[3-9]\d{9}$">手机号验证</button>
            <span>^1[3-9]\d{9}$</span>
        </div>
        <div class="regex-item">
            <button data-regex="(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)">身份证验证</button>
            <span>(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)</span>
        </div>
        <div class="regex-item">
            <button data-regex="^(https?|ftp)://[^\s/$.?#].[^\s]*$">URL验证</button>
            <span>^(https?|ftp)://[^\s/$.?#].[^\s]*$</span>
        </div>
        <div class="regex-item">
            <button data-regex="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$">IP地址验证</button>
            <span>^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$</span>
        </div>
        <div class="regex-item">
            <button data-regex="^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$">日期验证 (YYYY-MM-DD)</button>
            <span>^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$</span>
        </div>
        <div class="regex-item">
            <button data-regex="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$">密码强度验证</button>
            <span>^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$</span>
        </div>
        <div class="regex-item">
            <button data-regex="<[^>]+>">HTML标签提取</button>
            <span><[^>]+></span>
        </div>
        <div class="regex-item">
            <button data-regex="^-?\d+(\.\d+)?$">数字验证</button>
            <span>^-?\d+(\.\d+)?$</span>
        </div>
    </div>

    <div id="copyNotice" class="copy-notice">已复制到剪贴板!</div>

    <script>
        const regexInput = document.getElementById('regex');
        const textInput = document.getElementById('text');
        const resultOutput = document.getElementById('result');
        const errorDiv = document.getElementById('error');
        const matchBtn = document.getElementById('matchBtn');
        const copyNotice = document.getElementById('copyNotice');

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

        // 添加常用正则表达式按钮点击事件
        document.querySelectorAll('.regex-item button').forEach(button => {
            button.addEventListener('click', () => {
                const regex = button.getAttribute('data-regex');
                navigator.clipboard.writeText(regex).then(() => {
                    showCopyNotice();
                }).catch(err => {
                    console.error('复制失败: ', err);
                });
            });
        });

        function showCopyNotice() {
            copyNotice.style.opacity = '1';
            setTimeout(() => {
                copyNotice.style.opacity = '0';
            }, 2000);
        }

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
</html>    `;
}
function getTimestampWebviewContent() {
	return `
	<!DOCTYPE html>
	<html lang="zh">
	<head>
	  <meta charset="UTF-8">
	  <style>
		body {
		  margin: 0;
		  padding: 0;
		  background: #f4f7f9;
		  font-family: 'Segoe UI', sans-serif;
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  height: 100vh;
		}
		.card {
		  background: #fff;
		  padding: 30px 40px;
		  border-radius: 16px;
		  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
		  text-align: center;
		  width: 360px;
		}
		.title {
		  font-size: 1.5em;
		  color: #333;
		  margin-bottom: 10px;
		}
		.unit {
		  color: #4caf50;
		  font-weight: bold;
		}
		#timestamp {
		  font-size: 2.5em;
		  font-weight: bold;
		  margin: 20px 0;
		  color: #222;
		}
		.button-group {
		  display: flex;
		  justify-content: space-between;
		  margin-top: 20px;
		}
		button {
		  flex: 1;
		  margin: 0 5px;
		  padding: 10px 12px;
		  font-size: 1em;
		  background-color: #4caf50;
		  color: white;
		  border: none;
		  border-radius: 8px;
		  cursor: pointer;
		  transition: background 0.2s;
		}
		button:hover {
		  background-color: #43a047;
		}
	  </style>
	</head>
	<body>
	  <div class="card">
		<div class="title">当前时间戳（<span class="unit" id="unitLabel">秒</span>）</div>
		<div id="timestamp">0</div>
		<div class="button-group">
		  <button onclick="switchUnit()">切换单位</button>
		  <button onclick="copy()">复制</button>
		  <button onclick="toggle()" id="toggleBtn">暂停</button>
		</div>
	  </div>
  
	  <script>
		const vscode = acquireVsCodeApi();
		let useMs = false;
		let running = true;
		let timer;
  
		function update() {
		  const now = Date.now();
		  const value = useMs ? now : Math.floor(now / 1000);
		  document.getElementById('timestamp').textContent = value;
		}
  
		function loop() {
		  update();
		  timer = setInterval(update, 1000);
		}
  
		function switchUnit() {
		  useMs = !useMs;
		  document.getElementById('unitLabel').textContent = useMs ? '毫秒' : '秒';
		  update();
		}
  
		function copy() {
		  const text = document.getElementById('timestamp').textContent;
		  vscode.postMessage({ command: 'copy', text });
		}
  
		function toggle() {
		  const btn = document.getElementById('toggleBtn');
		  if (running) {
			clearInterval(timer);
			btn.textContent = '继续';
		  } else {
			loop();
			btn.textContent = '暂停';
		  }
		  running = !running;
		}
  
		loop();
	  </script>
	</body>
	</html>
	`;
}
function getTimestampWebviewHtml() {
	return `
	<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>时间戳 ↔ 日期互转</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f7f9fb;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    h2 {
      margin-top: 0;
      font-size: 1.4em;
      color: #0d1117;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
    }
    .section {
      margin-bottom: 30px;
    }
    .form-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    input[type="text"], select, input[type="datetime-local"] {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      flex: 1;
      min-width: 180px;
      font-size: 14px;
    }
    button {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    button:hover {
      background-color: #2563eb;
    }
    .result {
      font-weight: bold;
      color: #1d4ed8;
      margin-left: 8px;
      min-width: 160px;
      word-wrap: break-word;
      white-space: pre-wrap;
      user-select: text;
      cursor: text;
      padding: 4px;
      background: #f0f8ff;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="section">
      <h2>🕒 时间戳转日期时间</h2>
      <div class="form-row">
        <input type="text" id="timestampInput" placeholder="输入时间戳">
        <select id="unitSelect">
          <option value="s">秒(s)</option>
          <option value="ms">毫秒(ms)</option>
        </select>
        <button onclick="convertToDate()">转换</button>
        <span class="result" id="dateResult" contenteditable="true"></span>
        <select id="timezoneSelect"></select>
      </div>
    </div>

    <div class="section">
      <h2>📅 日期时间转时间戳</h2>
      <div class="form-row">
        <input type="datetime-local" id="dateInput">
        <select id="timezoneSelect2"></select>
        <button onclick="convertToTimestamp()">转换</button>
        <span class="result" id="timestampResult" contenteditable="true"></span>
        <select id="unitSelect2">
          <option value="s">秒(s)</option>
          <option value="ms">毫秒(ms)</option>
        </select>
      </div>
    </div>
  </div>

  <script>
    const timezones = Intl.supportedValuesOf('timeZone');
    const timezoneSelect = document.getElementById('timezoneSelect');
    const timezoneSelect2 = document.getElementById('timezoneSelect2');

    timezones.forEach(zone => {
      const opt1 = new Option(zone, zone);
      const opt2 = new Option(zone, zone);
      timezoneSelect.add(opt1);
      timezoneSelect2.add(opt2);
    });

    timezoneSelect.value = 'Asia/Shanghai';
    timezoneSelect2.value = 'Asia/Shanghai';

    function convertToDate() {
      const timestamp = document.getElementById('timestampInput').value.trim();
      const unit = document.getElementById('unitSelect').value;
      const zone = document.getElementById('timezoneSelect').value;

      if (!timestamp) return;

      const ts = unit === 's' ? Number(timestamp) * 1000 : Number(timestamp);
      try {
        const date = new Date(ts);
        const result = new Intl.DateTimeFormat('zh-CN', {
          timeZone: zone,
          dateStyle: 'full',
          timeStyle: 'long'
        }).format(date);
        document.getElementById('dateResult').textContent = result;
      } catch {
        document.getElementById('dateResult').textContent = '无效时间戳';
      }
    }

    function convertToTimestamp() {
      const datetime = document.getElementById('dateInput').value;
      const zone = document.getElementById('timezoneSelect2').value;
      const unit = document.getElementById('unitSelect2').value;

      if (!datetime) return;

      const localTime = new Date(datetime);
      const utcTime = new Date(localTime.toLocaleString('en-US', { timeZone: zone }));

      const ts = utcTime.getTime();
      const result = unit === 's' ? Math.floor(ts / 1000) : ts;

      document.getElementById('timestampResult').textContent = result;
    }
  </script>
</body>
</html>

	`;
}
function getUtcWebviewHtml() {
	return `
	<!DOCTYPE html>
	<html lang="zh">
	<head>
	  <meta charset="UTF-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	  <title>UTC 时间</title>
	  <style>
	    * {
    		user-select: text !important;
  		}
		body {
		  margin: 0;
		  padding: 0;
		  font-family: "Segoe UI", "Helvetica Neue", sans-serif;
		  background: linear-gradient(to right, #e0f2fe, #f0f9ff);
		  color: #1e293b;
		}
		.container {
		  max-width: 600px;
		  margin: 40px auto;
		  background: #ffffff;
		  border-radius: 16px;
		  padding: 30px;
		  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
		}
		h2 {
		  margin-top: 0;
		  font-size: 1.6em;
		  text-align: center;
		  color: #2563eb;
		  border-bottom: 2px solid #e5e7eb;
		  padding-bottom: 10px;
		}
		.info-block {
		  margin: 20px 0;
		  padding: 16px 20px;
		  border-left: 4px solid #3b82f6;
		  background: #f9fafb;
		  border-radius: 8px;
		}
		.info-block p {
		  margin: 8px 0;
		  font-size: 1.1em;
		  line-height: 1.5;
		}
		.label {
		  font-weight: bold;
		  color: #0f172a;
		}
		.highlight {
		  color: #2563eb;
		  font-weight: bold;
		}
	  </style>
	</head>
	<body>
	  <div class="container">
		<h2>🌐 时间信息展示</h2>
  
		<div class="info-block">
		  <p><span class="label">当前 UTC 时间：</span><span id="utcTime" class="highlight"></span></p>
		</div>
  
		<div class="info-block">
		  <p><span class="label">北京时间（Asia/Shanghai）：</span></p>
		  <p><span class="label">日期：</span><span id="dateInfo" class="highlight"></span></p>
		  <p><span class="label">星期：</span><span id="weekDay" class="highlight"></span></p>
		  <p><span class="label">第 <span id="weekNumber" class="highlight"></span> 周</p>
		</div>
	  </div>
  
	  <script>
		const utcTimeElement = document.getElementById('utcTime');
		const dateInfoElement = document.getElementById('dateInfo');
		const weekDayElement = document.getElementById('weekDay');
		const weekNumberElement = document.getElementById('weekNumber');
  
		const timeZone = 'Asia/Shanghai';
  
		function getWeekNumber(date) {
		  const firstDay = new Date(date.getFullYear(), 0, 1);
		  const dayOfYear = Math.floor((date - firstDay + 86400000) / 86400000);
		  return Math.ceil((dayOfYear + firstDay.getDay()) / 7);
		}
  
		function updateTime() {
		  const now = new Date();
		  utcTimeElement.textContent = now.toUTCString();
  
		  const formatter = new Intl.DateTimeFormat('zh-CN', {
			timeZone: timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			weekday: 'long',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		  });
  
		  const parts = formatter.formatToParts(now);
		  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
		  const localTimeStr = \`\${map.year}-\${map.month}-\${map.day}T\${map.hour}:\${map.minute}:\${map.second}\`;
		  const localDate = new Date(localTimeStr);
  
		  dateInfoElement.textContent = \`\${map.year}年\${map.month}月\${map.day}日\`;
		  weekDayElement.textContent = map.weekday;
		  weekNumberElement.textContent = getWeekNumber(localDate);
		}
  
		updateTime();
		setInterval(updateTime, 1000);
	  </script>
	</body>
	</html>
	`;
}
function getJsonToCppWebviewHtml() {
	return `<!DOCTYPE html>
  <html lang="zh">
  <head>
	<meta charset="UTF-8" />
	<title>JSON 转 C++ Class</title>
	<style>
	  body {
		font-family: "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
		margin: 0;
		padding: 30px;
		background: linear-gradient(to right, #e0f7fa, #f0f9ff);
		color: #333;
	  }
  
	  h3 {
		text-align: center;
		color: #007acc;
		margin-bottom: 20px;
	  }
  
	  .top-bar {
		text-align: center;
		margin-bottom: 16px;
	  }
  
	  button {
		background-color: #007acc;
		color: white;
		padding: 8px 18px;
		font-size: 14px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.3s ease;
	  }
  
	  button:hover {
		background-color: #005f99;
	  }
  
	  .container {
		display: flex;
		height: 500px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 8px 30px rgba(209, 205, 205, 0.636);
		background-color: #ffffff;
	  }
  
	  textarea {
		width: 50%;
		padding: 10px;
		font-family: monospace;
		font-size: 14px;
		border: none;
		box-sizing: border-box;
		resize: none;
		outline: none;
		background-color: #ffffff;
		border-right: 1px solid #e0e0e0;
	  }
  
	  .output-panel {
		width: 50%;
		display: flex;
		flex-direction: column;
	  }
  
	  .copy-bar {
		text-align: right;
		padding: 10px 16px 0;
		background-color: #f7f9fa;
		border-bottom: 1px solid #e0e0e0;
	  }
  
	  .output-panel pre {
		flex: 1;
		background-color: #f7f9fa;
		margin: 0;
		overflow: auto;
		white-space: pre-wrap;
		padding: 10px;
		font-family: monospace;
		font-size: 14px;
		color: #000;
		box-sizing: border-box;
	  }
  
	  .copy-notice {
		display: none;
		text-align: center;
		background-color: #dff0d8;
		color: #3c763d;
		padding: 10px;
		margin-bottom: 10px;
		font-size: 14px;
		border-radius: 4px;
		width: fit-content;
		margin: 10px auto;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	  }
	</style>
  </head>
  <body>
	<h3>🛠️ JSON 转 C++ Class</h3>
  
	<div id="copyNotice" class="copy-notice">已复制到剪贴板!</div>
  
	<div class="top-bar">
	  <button id="convertBtn">转换为 C++</button>
	</div>
  
	<div class="container">
	  <textarea id="jsonInput" placeholder="请输入 JSON..."></textarea>
	  <div class="output-panel">
		<div class="copy-bar">
		  <button id="copyBtn">复制</button>
		</div>
		<pre id="result">（点击“转换为 C++”后显示结果）</pre>
	  </div>
	</div>
  
	<script>
	  const input = document.getElementById('jsonInput');
	  const result = document.getElementById('result');
	  const convertBtn = document.getElementById('convertBtn');
	  const copyBtn = document.getElementById('copyBtn');
	  const copyNotice = document.getElementById('copyNotice');
  
	  function toCppType(value) {
		if (typeof value === 'string') return 'std::string';
		if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
		if (typeof value === 'boolean') return 'bool';
		if (Array.isArray(value)) return 'std::vector<' + toCppType(value[0]) + '>';
		if (typeof value === 'object' && value !== null) return '/* nested object */';
		return '/* unknown type */';
	  }
  
	  function jsonToCpp(json, className = "MyClass") {
		let result = \`class \${className} {\npublic:\n\`;
		for (const key in json) {
		  const type = toCppType(json[key]);
		  result += \`    \${type} \${key};\n\`;
		}
		result += '};';
		return result;
	  }
  
	  convertBtn.addEventListener('click', () => {
		try {
		  const json = JSON.parse(input.value);
		  const cppCode = jsonToCpp(json);
		  result.textContent = cppCode;
		} catch (e) {
		  result.textContent = '转换失败，请检查 JSON 格式';
		}
	  });
  
	  copyBtn.addEventListener('click', () => {
		const text = result.textContent;
		if (text && text !== '转换失败，请检查 JSON 格式') {
		  navigator.clipboard.writeText(text).then(() => {
			copyNotice.textContent = '已复制到剪贴板!';
			copyNotice.style.backgroundColor = '#dff0d8';
			copyNotice.style.color = '#3c763d';
			copyNotice.style.display = 'block';
			setTimeout(() => {
			  copyNotice.style.display = 'none';
			}, 2000);
		  }).catch(() => {
			copyNotice.textContent = '复制失败，请检查权限';
			copyNotice.style.backgroundColor = '#f2dede';
			copyNotice.style.color = '#a94442';
			copyNotice.style.display = 'block';
			setTimeout(() => {
			  copyNotice.style.display = 'none';
			}, 2000);
		  });
		}
	  });
	</script>	
  </body>
  </html>`;
}
function getJsonToPythonWebviewHtml() {
	return `<!DOCTYPE html>
  <html lang="zh">
  <head>
	<meta charset="UTF-8" />
	<title>JSON 转 Python Class</title>
	<style>
	  body {
		font-family: "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
		margin: 0;
		padding: 30px;
		background: linear-gradient(to right, #f7fcf9, #f0f9ff);
		color: #333;
	  }
  
	  h3 {
		text-align: center;
		color: #3c763d;
		margin-bottom: 20px;
	  }
  
	  .top-bar {
		text-align: center;
		margin-bottom: 16px;
	  }
  
	  button {
		background-color: #3c763d;
		color: white;
		padding: 8px 18px;
		font-size: 14px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.3s ease;
	  }
  
	  button:hover {
		background-color: #2e5d2e;
	  }
  
	  .container {
		display: flex;
		height: 500px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 8px 30px rgba(209, 205, 205, 0.636);
		background-color: #ffffff;
	  }
  
	  textarea {
		width: 50%;
		padding: 10px;
		font-family: monospace;
		font-size: 14px;
		border: none;
		box-sizing: border-box;
		resize: none;
		outline: none;
		background-color: #ffffff;
		border-right: 1px solid #e0e0e0;
	  }
  
	  .output-panel {
		width: 50%;
		display: flex;
		flex-direction: column;
	  }
  
	  .copy-bar {
		text-align: right;
		padding: 10px 16px 0;
		background-color: #f7f9fa;
		border-bottom: 1px solid #e0e0e0;
	  }
  
	  .output-panel pre {
		flex: 1;
		background-color: #f7f9fa;
		margin: 0;
		overflow: auto;
		white-space: pre-wrap;
		padding: 10px;
		font-family: monospace;
		font-size: 14px;
		color: #000;
		box-sizing: border-box;
	  }
  
	  .copy-notice {
		display: none;
		text-align: center;
		background-color: #dff0d8;
		color: #3c763d;
		padding: 10px;
		margin-bottom: 10px;
		font-size: 14px;
		border-radius: 4px;
		width: fit-content;
		margin: 10px auto;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	  }
	</style>
  </head>
  <body>
	<h3>🐍 JSON 转 Python Class</h3>
  
	<div id="copyNotice" class="copy-notice">已复制到剪贴板!</div>
  
	<div class="top-bar">
	  <button id="convertBtn">转换为 Python 类</button>
	</div>
  
	<div class="container">
	  <textarea id="jsonInput" placeholder="请输入 JSON..."></textarea>
	  <div class="output-panel">
		<div class="copy-bar">
		  <button id="copyBtn">复制</button>
		</div>
		<pre id="result">（点击“转换为 Python 类”后显示结果）</pre>
	  </div>
	</div>
  
	<script>
	  const input = document.getElementById('jsonInput');
	  const result = document.getElementById('result');
	  const convertBtn = document.getElementById('convertBtn');
	  const copyBtn = document.getElementById('copyBtn');
	  const copyNotice = document.getElementById('copyNotice');
  
	  function capitalize(name) {
		return name.charAt(0).toUpperCase() + name.slice(1);
	  }
  
	  function guessType(value) {
		if (typeof value === 'string') return "''";
		if (typeof value === 'number') return Number.isInteger(value) ? '0' : '0.0';
		if (typeof value === 'boolean') return 'False';
		if (value === null) return 'None';
		if (Array.isArray(value)) return '[]';
		return '{}';
	  }
  
	  function generatePythonClasses(json, className = "Root", classMap = {}) {
		const lines = [];
		const props = [];
  
		for (const key in json) {
		  const value = json[key];
		  if (Array.isArray(value)) {
			if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
			  const subClassName = capitalize(key.slice(0, -1));
			  generatePythonClasses(value[0], subClassName, classMap);
			  props.push(\`self.\${key} = []\`);
			} else {
			  props.push(\`self.\${key} = []\`);
			}
		  } else if (typeof value === 'object' && value !== null) {
			const subClassName = capitalize(key);
			generatePythonClasses(value, subClassName, classMap);
			props.push(\`self.\${key} = \${subClassName}()\`);
		  } else {
			props.push(\`self.\${key} = \${guessType(value)}\`);
		  }
		}
  
		const classDef = [
		  \`class \${className}:\`,
		  '    def __init__(self):',
		  props.length ? props.map(p => '        ' + p).join('\\n') : '        pass',
		  ''
		].join('\\n');
  
		classMap[className] = classDef;
		return classMap;
	  }
  
	  convertBtn.addEventListener('click', () => {
		try {
		  const json = JSON.parse(input.value);
		  const classMap = generatePythonClasses(json);
		  const output = Object.values(classMap).reverse().join('\\n\\n');
		  result.textContent = output;
		} catch (e) {
		  result.textContent = '转换失败，请检查 JSON 格式';
		}
	  });
  
	  copyBtn.addEventListener('click', () => {
		const text = result.textContent;
		if (text && text !== '转换失败，请检查 JSON 格式') {
		  navigator.clipboard.writeText(text).then(() => {
			copyNotice.textContent = '已复制到剪贴板!';
			copyNotice.style.backgroundColor = '#dff0d8';
			copyNotice.style.color = '#3c763d';
			copyNotice.style.display = 'block';
			setTimeout(() => {
			  copyNotice.style.display = 'none';
			}, 2000);
		  }).catch(() => {
			copyNotice.textContent = '复制失败，请检查权限';
			copyNotice.style.backgroundColor = '#f2dede';
			copyNotice.style.color = '#a94442';
			copyNotice.style.display = 'block';
			setTimeout(() => {
			  copyNotice.style.display = 'none';
			}, 2000);
		  });
		}
	  });
	</script>
  </body>
  </html>`;
}


function deactivate() { }

module.exports = { activate, deactivate };
