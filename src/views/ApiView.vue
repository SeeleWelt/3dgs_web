<template>
	<div class="api-docs">

		<div class="docs-layout">
			<aside class="toc">
				<div class="toc-title">目录</div>
				<ul>
					<li v-for="item in toc" :key="item.id" class="toc-item">
						<a :href="`#${item.id}`">{{ item.label }}</a>
						<ul v-if="item.children" class="toc-sub">
							<li v-for="child in item.children" :key="child.id">
								<a :href="`#${child.id}`">{{ child.label }}</a>
							</li>
						</ul>
					</li>
				</ul>
			</aside>

			<main class="docs-content">
				<section id="overview" class="doc-section">
					<div class="section-header">
						<h2>3DGS API</h2>
						<p>这是通过编程方式与 3DGS 系统交互的 API 参考文档。</p>
					</div>
					<div class="info-card">
						<div class="info-title">基础说明</div>
						<div class="info-body">
							<div class="info-grid">
                <div>
									<div class="info-label">请求地址</div>
									<div class="info-value">https://szgm.tenyunn.com:50585/backend/api</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="quickstart" class="doc-section">
					<div class="section-header">
						<h2>快速入门</h2>
						<p>使用以下流程快速完成 API 调用：创建密钥、上传素材、查询任务并下载模型。</p>
					</div>
					<div class="step-grid">
						<div class="step-card">
							<div class="step-index">01</div>
							<div class="step-title">创建 API 密钥</div>
							<div class="step-desc">在开发者中心生成密钥，保存后用于鉴权。</div>
						</div>
						<div class="step-card">
							<div class="step-index">02</div>
							<div class="step-title">上传视频或图片</div>
							<div class="step-desc">提交扫描素材，获取任务 ID。</div>
						</div>
						<div class="step-card">
							<div class="step-index">03</div>
							<div class="step-title">查询任务状态</div>
							<div class="step-desc">轮询或通过 Webhook 获取完成状态。</div>
						</div>
						<div class="step-card">
							<div class="step-index">04</div>
							<div class="step-title">下载 3D 模型</div>
							<div class="step-desc">使用任务 ID 获取下载链接或直传文件。</div>
						</div>
					</div>
				</section>

				<section id="auth" class="doc-section">
					<div class="section-header">
						<h2>验证</h2>
						<p>使用 API 密钥进行请求鉴权。</p>
					</div>

					<div id="auth-create-key" class="sub-section">
						<h3>创建 API 密钥</h3>
						<p>请前往开发者中心创建密钥。注意生成后仅显示一次。</p>
					</div>

					<div id="auth-use-key" class="sub-section">
						<h3>使用 API 密钥</h3>
						<p>在请求头中携带密钥。</p>
						<div class="code-card">
							<div class="code-title">请求头示例</div>
							<pre><code class="language-http">Authorization: Bearer &lt;API_KEY&gt;</code></pre>
						</div>
					</div>
				</section>

				<section id="scan" class="doc-section">
					<div class="section-header">
						<h2>3DGS 扫描</h2>
						<p>上传视频或图片进行 3DGS 重建。</p>
					</div>

					<div id="scan-video" class="sub-section">
						<h3>视频上传</h3>
						<div class="endpoint-card">
							<div class="endpoint">POST /v1/open/videoUpload</div>
							<div class="endpoint-meta">支持 multipart/form-data</div>
						</div>
						<div>
							<h4>Request</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>位置</th>
										<th>字段</th>
										<th>类型</th>
										<th>必填</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Header</td>
										<td>Authorization</td>
										<td>String</td>
										<td>是</td>
										<td>Bearer &lt;API_KEY&gt;</td>
									</tr>
									<tr>
										<td>Form</td>
										<td>videos</td>
										<td>File</td>
										<td>是</td>
										<td>上传视频文件，字段名固定为 videos，支持 .mp4/.avi/.mov/.mkv/.webm，只支持单文件；最大 1GB</td>
									</tr>
									<tr>
										<td>Form</td>
										<td>params</td>
										<td>String(JSON)</td>
										<td>是</td>
										<td>JSON 字符串，见 Attributes</td>
									</tr>
								</tbody>
							</table>
							<div class="code-card">
								<div class="code-title">请求示例</div>
								<pre><code class="language-bash">curl -X POST "https://szgm.tenyunn.com:50585/v1/open/videoUpload" \
  -H "Authorization: Bearer &lt;API_KEY&gt;" \
  -F "videos=@/path/to/video.mp4" \
  -F 'params={"task_name":"my_task","bg_remove":false,"user_object_description":""}'</code></pre>
							</div>
						</div>
						<div>
							<h4>Response</h4>
							<div class="code-card">
								<div class="code-title">成功响应示例</div>
								<pre><code class="language-json">{
  "code": 200,
  "message": "Success",
  "task_id": "b7a21c63-3f23-4b1c-bd2d-8c9d7e1d5c1f",
  "task_name": "my_task"
}</code></pre>
							</div>
						</div>
						<div>
							<h4>Attributes</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>字段</th>
										<th>类型</th>
										<th>必填</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>task_name</td>
										<td>String</td>
										<td>是</td>
										<td>1-50 字符，仅中文/字母/数字/下划线</td>
									</tr>
									<tr>
										<td>bg_remove</td>
										<td>Boolean</td>
										<td>否</td>
										<td>是否开启背景移除</td>
									</tr>
									<tr>
										<td>user_object_description</td>
										<td>String</td>
										<td>否</td>
										<td>用户自定义物体描述</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- <div id="scan-image" class="sub-section">
						<h3>图片上传</h3>
						<div class="endpoint-card">
							<div class="endpoint">POST /api/upload</div>
							<div class="endpoint-meta">支持多图上传（待补充）</div>
						</div>
						<div class="placeholder">请求参数与响应示例待补充。</div>
					</div> -->
				</section>

				<section id="model" class="doc-section">
					<div class="section-header">
						<h2>模型</h2>
						<p>查询重建任务状态并下载模型。</p>
					</div>

					<div id="model-status" class="sub-section">
						<h3>获取重建任务状态</h3>
						<div class="endpoint-card">
							<div class="endpoint">GET /v1/open/getModelStatus</div>
							<div class="endpoint-meta">返回任务状态</div>
						</div>
						<div>
							<h4>Request</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>位置</th>
										<th>字段</th>
										<th>类型</th>
										<th>必填</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Header</td>
										<td>Authorization</td>
										<td>String</td>
										<td>是</td>
										<td>Bearer &lt;API_KEY&gt;</td>
									</tr>
									<tr>
										<td>Query</td>
										<td>task_id</td>
										<td>String</td>
										<td>是</td>
										<td>任务 ID</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div>
							<h4>Response</h4>
							<div class="code-card">
								<div class="code-title">成功响应示例</div>
								<pre><code class="language-json">{
  "code": 200,
  "message": "Success",
  "data": {
    "status": "received"
  }
}</code></pre>
							</div>
						</div>
						<div>
							<h4>Attributes</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>字段</th>
										<th>类型</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>code</td>
										<td>Number</td>
										<td>200 表示成功</td>
									</tr>
									<tr>
										<td>message</td>
										<td>String</td>
										<td>返回消息</td>
									</tr>
									<tr>
										<td>data.status</td>
										<td>String</td>
										<td>任务状态</td>
									</tr>
								</tbody>
							</table>
						</div>
            <div>
              <h4>任务状态</h4>
						<table class="param-table">
							<thead>
								<tr>
									<th>状态</th>
									<th>说明</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>received</td>
									<td>已接收，等待处理</td>
								</tr>
								<tr>
									<td>slicing</td>
									<td>视频切片中</td>
								</tr>
								<tr>
									<td>reconstructing_colmap</td>
									<td>COLMAP 重建中</td>
								</tr>
								<tr>
									<td>reconstructing_3dgs</td>
									<td>3DGS 训练中</td>
								</tr>
								<tr>
									<td>reconstructing_lightning</td>
									<td>Lightning 快速重建中</td>
								</tr>
								<tr>
									<td>processing_bg_removal</td>
									<td>背景去除处理中</td>
								</tr>
								<tr>
									<td>paused</td>
									<td>已暂停</td>
								</tr>
								<tr>
									<td>resuming</td>
									<td>恢复中</td>
								</tr>
								<tr>
									<td>completed</td>
									<td>已完成</td>
								</tr>
								<tr>
									<td>failed</td>
									<td>失败</td>
								</tr>
							</tbody>
						</table>
            </div>
					</div>

					<div id="model-download" class="sub-section">
						<h3>下载 3D 模型</h3>
						<div class="endpoint-card">
							<div class="endpoint">GET /v1/open/downModel</div>
						</div>
						<div>
							<h4>Request</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>位置</th>
										<th>字段</th>
										<th>类型</th>
										<th>必填</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Header</td>
										<td>Authorization</td>
										<td>String</td>
										<td>是</td>
										<td>Bearer &lt;API_KEY&gt;</td>
									</tr>
									<tr>
										<td>Query</td>
										<td>task_id</td>
										<td>String</td>
										<td>是</td>
										<td>任务 ID</td>
									</tr>
								</tbody>
							</table>
							<div class="code-card">
								<div class="code-title">请求示例</div>
								<pre><code class="language-bash">curl -L -o model.sog "https://szgm.tenyunn.com:50585/v1/open/downModel?task_id=YOUR_TASK_ID" \
  -H "Authorization: Bearer &lt;API_KEY&gt;"</code></pre>
							</div>
						</div>
						<div>
							<h4>Response</h4>
							<div class="code-card">
								<div class="code-title">成功响应说明</div>
								<pre><code class="language-text">Content-Type: application/octet-stream
Content-Disposition: attachment; filename="&lt;task_name&gt;.sog"
Binary file stream</code></pre>
							</div>
						</div>
						<div>
							<h4>Attributes</h4>
							<table class="param-table">
								<thead>
									<tr>
										<th>字段</th>
										<th>类型</th>
										<th>说明</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>task_id</td>
										<td>String</td>
										<td>任务 ID，任务需已完成且更新不超过 7 天</td>
									</tr>
									<tr>
										<td>响应文件</td>
										<td>Binary</td>
										<td>返回 .sog 文件流</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</section>

				<section id="quota" class="doc-section">
					<div class="section-header">
						<h2>额度</h2>
						<p>查询剩余算力点额度。</p>
					</div>
					<div class="endpoint-card">
						<div class="endpoint">GET /v1/open/getCredits</div>
						<div class="endpoint-meta">返回当前算力点余额</div>
					</div>
					<div>
						<h4>Request</h4>
						<table class="param-table">
							<thead>
								<tr>
									<th>位置</th>
									<th>字段</th>
									<th>类型</th>
									<th>必填</th>
									<th>说明</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Header</td>
									<td>Authorization</td>
									<td>String</td>
									<td>是</td>
									<td>Bearer &lt;API_KEY&gt;</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div>
						<h4>Response</h4>
						<div class="code-card">
							<div class="code-title">成功响应示例</div>
							<pre><code class="language-json">{
  "code": 200,
  "data": {
    "open_credits_total": 1000,
    "open_credits_available": 680,
    "open_credits_used": 320
  }
}</code></pre>
						</div>
					</div>
					<div>
						<h4>Attributes</h4>
						<table class="param-table">
							<thead>
								<tr>
									<th>字段</th>
									<th>类型</th>
									<th>说明</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>open_credits_total</td>
									<td>Number</td>
									<td>总额度</td>
								</tr>
								<tr>
									<td>open_credits_available</td>
									<td>Number</td>
									<td>可用额度</td>
								</tr>
								<tr>
									<td>open_credits_used</td>
									<td>Number</td>
									<td>已使用额度</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section id="webhook" class="doc-section">
					<div class="section-header">
						<h2>使用 Webhook</h2>
						<p>用于接收任务完成等事件通知。</p>
					</div>
					<div class="info-card">
						<div class="info-title">Webhook 需要满足以下三项要素</div>
						<ol class="doc-list">
							<li>
								Webhook 可在开发者中心“设置 &gt; Webhooks”中创建与管理。
							</li>
							<li>
								回调地址（Callback URL）：当模型状态变更时，系统会向该地址发送 POST 请求。
							</li>
							<li>
								签名密钥（Secret）：长度 6-50 的随机字符串，用于签名每次请求。
								用于加密回调内容，请在服务端使用相同密钥解密。
							</li>
						</ol>
					</div>

					<div class="sub-section">
						<h3>重要说明</h3>
						<ol class="doc-list emphasis">
							<li>请确保 NotifyUrl 可被公网访问。</li>
							<li>回调为 POST JSON，字段为 data/iv/tag，需用 secret 解密。</li>
							<li>收到通知后请返回 HTTP 200，否则每 30s 重试一次，最多 3 次。</li>
						</ol>
					</div>
					<div class="code-card">
						<div class="code-title">参数解密示例 (Node.js)</div>
						<pre><code class="language-javascript">const crypto = require('crypto');

function decryptWebhookPayload(payload, secret) {
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return JSON.parse(decrypted.toString('utf8'));
}
</code></pre>
					</div>
					<div class="code-card">
						<div class="code-title">参数解密示例 (Python)</div>
						<pre><code class="language-python">import base64
import hashlib
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decrypt_webhook_payload(payload, secret):
    key = hashlib.sha256(secret.encode('utf-8')).digest()
    iv = base64.b64decode(payload['iv'])
    data = base64.b64decode(payload['data'])
    tag = base64.b64decode(payload['tag'])
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(iv, data + tag, None)
    return json.loads(plaintext.decode('utf-8'))
</code></pre>
					</div>
				</section>

				<section id="errors" class="doc-section">
					<div class="section-header">
						<h2>错误</h2>
						<p>所有错误返回统一格式。</p>
					</div>
					<div class="code-card">
						<div class="code-title">错误响应示例</div>
						<pre><code class="language-json">{
	"code": 2002,
	"message": "任务ID格式不正确"
}</code></pre>
					</div>
					<div>
						<h4>业务错误码</h4>
						<table class="param-table">
							<thead>
								<tr>
									<th>错误码</th>
									<th>说明</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>2001</td>
									<td>缺少 task_id</td>
								</tr>
								<tr>
									<td>2002</td>
									<td>任务ID格式不正确</td>
								</tr>
								<tr>
									<td>2003</td>
									<td>无权访问此任务</td>
								</tr>
								<tr>
									<td>2004</td>
									<td>任务未找到</td>
								</tr>
								<tr>
									<td>2005</td>
									<td>任务尚未完成</td>
								</tr>
								<tr>
									<td>2006</td>
									<td>模型已超过7天，不提供下载</td>
								</tr>
								<tr>
									<td>2007</td>
									<td>不支持的格式</td>
								</tr>
								<tr>
									<td>2008</td>
									<td>模型文件未找到</td>
								</tr>
								<tr>
									<td>2010</td>
									<td>剩余可用算力点不足</td>
								</tr>
								<tr>
									<td>2011</td>
									<td>任务名称不符合要求</td>
								</tr>
								<tr>
									<td>2012</td>
									<td>参数不合格</td>
								</tr>
								<tr>
									<td>2500</td>
									<td>服务器错误</td>
								</tr>
								<tr>
									<td>2501</td>
									<td>上传失败</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section id="status-codes" class="doc-section">
					<div class="section-header">
						<h2>状态码</h2>
						<p>HTTP 状态码说明。</p>
					</div>
					<table class="param-table">
						<thead>
							<tr>
								<th>状态码</th>
								<th>含义</th>
								<th>说明</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>200</td>
								<td>OK</td>
								<td>请求成功</td>
							</tr>
							<tr>
								<td>400</td>
								<td>Bad Request</td>
								<td>请求参数错误</td>
							</tr>
							<tr>
								<td>401</td>
								<td>Unauthorized</td>
								<td>鉴权失败</td>
							</tr>
							<tr>
								<td>403</td>
								<td>Forbidden</td>
								<td>无权访问资源</td>
							</tr>
							<tr>
								<td>404</td>
								<td>Not Found</td>
								<td>资源未找到</td>
							</tr>
							<tr>
								<td>420</td>
								<td>Insufficient Credits</td>
								<td>算力点不足</td>
							</tr>
							<tr>
								<td>500</td>
								<td>Server Error</td>
								<td>服务器错误</td>
							</tr>
						</tbody>
					</table>
				</section>
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type TocItem = {
	id: string
	label: string
	children?: TocItem[]
}

const { t } = useI18n()

const toc = computed<TocItem[]>(() => [
	{ id: 'overview', label: t('apiDocs.overview.title') },
	{ id: 'quickstart', label: t('apiDocs.quickstart.title') },
	{
		id: 'auth',
		label: t('apiDocs.auth.title'),
		children: [
			{ id: 'auth-create-key', label: t('apiDocs.auth.createTitle') },
			{ id: 'auth-use-key', label: t('apiDocs.auth.useTitle') }
		]
	},
	{
		id: 'scan',
		label: t('apiDocs.scan.title'),
		children: [
			{ id: 'scan-video', label: t('apiDocs.scan.videoUpload') }
		]
	},
	{
		id: 'model',
		label: t('apiDocs.model.title'),
		children: [
			{ id: 'model-status', label: t('apiDocs.model.getStatus') },
			{ id: 'model-download', label: t('apiDocs.model.downloadMode') }
		]
	},
	{ id: 'quota', label: t('apiDocs.quota.title') },
	{ id: 'webhook', label: t('apiDocs.webhook.title') },
	{ id: 'errors', label: t('apiDocs.errors.title') },
	{ id: 'status-codes', label: t('apiDocs.statusCodes.title') }
])
</script>

<style scoped>
.api-docs {
	color: var(--text-primary);
	font-family: 'IBM Plex Sans', 'Noto Sans SC', sans-serif;
	display: flex;
	flex-direction: column;
	gap: 32px;
	animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.hero {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
	gap: 24px;
	padding: 32px;
	border-radius: 24px;
	background: linear-gradient(140deg, rgba(255, 255, 255, 0.7) 0%, rgba(229, 231, 235, 0.6) 100%);
	border: 1px solid var(--glass-border);
	overflow: hidden;
}

.hero::before,
.hero::after {
	content: '';
	position: absolute;
	border-radius: 50%;
	opacity: 0.5;
	filter: blur(0px);
	pointer-events: none;
}

.hero::before {
	width: 280px;
	height: 280px;
	right: -80px;
	top: -120px;
	background: radial-gradient(circle, rgba(21, 223, 205, 0.35), transparent 70%);
}

.hero::after {
	width: 220px;
	height: 220px;
	left: -60px;
	bottom: -100px;
	background: radial-gradient(circle, rgba(99, 102, 241, 0.25), transparent 70%);
}

.hero-content {
	position: relative;
	z-index: 1;
}

.hero-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 999px;
	background: rgba(21, 223, 205, 0.16);
	color: #0b6e65;
	font-weight: 600;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.hero h1 {
	margin: 16px 0 8px;
	font-size: 32px;
	font-weight: 700;
}

.hero p {
	margin: 0 0 20px;
	color: var(--text-secondary);
	max-width: 640px;
}

.hero-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.meta-item {
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(17, 24, 39, 0.08);
	border-radius: 12px;
	padding: 10px 14px;
	min-width: 160px;
}

.meta-label {
	display: block;
	font-size: 12px;
	color: var(--text-secondary);
}

.meta-value {
	font-weight: 600;
}

.hero-panel {
	position: relative;
	z-index: 1;
	background: rgba(17, 24, 39, 0.92);
	color: #f9fafb;
	border-radius: 18px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.panel-title {
	font-weight: 600;
	font-size: 14px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: rgba(249, 250, 251, 0.75);
}

.panel-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.panel-link {
	padding: 8px 10px;
	border-radius: 10px;
	background: rgba(249, 250, 251, 0.08);
	color: #f9fafb;
	text-decoration: none;
	font-size: 13px;
}

.panel-link:hover {
	background: rgba(249, 250, 251, 0.16);
}

.docs-layout {
	display: grid;
	grid-template-columns: 220px minmax(0, 1fr);
	gap: 24px;
}

.toc {
	position: sticky;
	top: 24px;
	align-self: start;
	background: var(--glass-surface);
	border: 1px solid var(--glass-border);
	border-radius: 18px;
	padding: 18px;
	max-height: calc(100vh - 80px);
	overflow: auto;
}

.toc-title {
	font-weight: 600;
	font-size: 14px;
	margin-bottom: 12px;
	color: var(--text-secondary);
}

.toc ul {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 10px;
}

.toc-item > a {
	color: var(--text-primary);
	text-decoration: none;
	font-size: 14px;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.toc-item > a::before {
	content: '';
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: rgba(17, 24, 39, 0.35);
}

.toc a:hover {
	color: #0b6e65;
}

.toc-sub {
	margin-top: 8px;
	padding-left: 18px;
	border-left: 1px solid rgba(15, 23, 42, 0.12);
	display: grid;
	gap: 6px;
}

.toc-sub a {
	color: var(--text-secondary);
	font-size: 13px;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.toc-sub a::before {
	content: '';
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: rgba(11, 110, 101, 0.45);
}

.docs-content {
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.doc-section {
	background: var(--glass-surface);
	border: 1px solid var(--glass-border);
	border-radius: 20px;
	padding: 28px;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.section-header h2 {
	margin: 0 0 6px;
	font-size: 24px;
}

.section-header p {
	margin: 0;
	color: var(--text-secondary);
}

.info-card {
	background: rgba(249, 250, 251, 0.9);
	border: 1px solid rgba(17, 24, 39, 0.08);
	border-radius: 16px;
	padding: 18px;
}

.info-title {
	font-weight: 600;
	margin-bottom: 8px;
}

.info-grid {
	margin-top: 12px;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
}

.info-label {
	font-size: 12px;
	color: var(--text-secondary);
}

.info-value {
	font-weight: 600;
}

.step-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 16px;
}

.step-card {
	background: rgba(17, 24, 39, 0.92);
	color: #f9fafb;
	border-radius: 16px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.step-index {
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(249, 250, 251, 0.7);
}

.step-title {
	font-weight: 600;
}

.step-desc {
	font-size: 13px;
	color: rgba(249, 250, 251, 0.75);
}

.code-card {
	border-radius: 16px;
	border: 1px solid rgba(17, 24, 39, 0.1);
	background: #0f172a;
	color: #e2e8f0;
	overflow: hidden;
}

.code-title {
	padding: 12px 16px;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	background: rgba(15, 23, 42, 0.9);
	border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.code-card pre {
	margin: 0;
	padding: 16px;
	white-space: pre-wrap;
	font-size: 13px;
}

.sub-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	border-radius: 16px;
	background: rgba(249, 250, 251, 0.7);
	border: 1px solid rgba(17, 24, 39, 0.08);
}

.sub-section h3 {
	margin: 0;
	font-size: 18px;
}

.endpoint-card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border-radius: 12px;
	background: rgba(15, 23, 42, 0.08);
	border: 1px solid rgba(15, 23, 42, 0.12);
}

.endpoint {
	font-weight: 600;
	font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
}

.endpoint-meta {
	font-size: 12px;
	color: var(--text-secondary);
}

.param-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
	background: white;
	border-radius: 12px;
	overflow: hidden;
}

.param-table th,
.param-table td {
	text-align: left;
	padding: 10px 12px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.param-table th {
	background: rgba(15, 23, 42, 0.05);
	font-weight: 600;
}

.placeholder {
	padding: 12px 14px;
	border-radius: 12px;
	border: 1px dashed rgba(15, 23, 42, 0.2);
	color: var(--text-secondary);
	background: rgba(255, 255, 255, 0.6);
}

.doc-list {
	margin: 0;
	padding-left: 20px;
	color: var(--text-secondary);
	display: grid;
	gap: 8px;
}

.doc-list.emphasis {
	color: var(--text-primary);
	font-weight: 600;
}

@media (max-width: 1024px) {
	.hero {
		grid-template-columns: 1fr;
	}

	.docs-layout {
		grid-template-columns: 1fr;
	}

	.toc {
		position: relative;
		max-height: none;
	}
}

@media (max-width: 640px) {
	.hero {
		padding: 24px;
	}

	.hero h1 {
		font-size: 26px;
	}

	.doc-section {
		padding: 20px;
	}

	.panel-grid {
		grid-template-columns: 1fr;
	}
}
</style>
