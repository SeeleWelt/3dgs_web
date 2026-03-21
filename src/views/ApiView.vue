<template>
	<div class="api-docs">

		<!-- Mobile Navigation Toggle -->
		<button class="mobile-nav-toggle" @click="toggleMobileMenu">
			<svg t="1773999064213" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="16792" width="20" height="20"><path d="M123.92 555.9a32 32 0 0 1-14.82-60.38l719.19-374.9a32 32 0 0 1 29.59 56.76l-719.2 374.89a31.87 31.87 0 0 1-14.76 3.63z" fill="#ffffff" p-id="16793"></path><path d="M608.6 957.7a32 32 0 0 1-30.6-41.27l234.64-776.34a32 32 0 0 1 61.26 18.52L639.22 935a32 32 0 0 1-30.62 22.7zM505.92 580.44c-0.68 0-1.36 0-2.05-0.07l-381.46-24.12a32 32 0 1 1 4-63.88l381.5 24.13a32 32 0 0 1-2 63.94z" fill="#ffffff" p-id="16794"></path><path d="M608.14 957.32a32 32 0 0 1-30.87-23.63L475 556.82a32 32 0 1 1 61.77-16.76L639 916.93a32 32 0 0 1-22.51 39.26 31.61 31.61 0 0 1-8.35 1.13z" fill="#ffffff" p-id="16795"></path></svg>
		</button>

		<!-- Mobile Navigation Menu (Drawer) -->
		<div class="mobile-nav-menu" :class="{ open: isMobileMenuOpen }">
			<div class="mobile-nav-header">
				<span>目录</span>
				<button class="mobile-nav-close" @click="closeMobileMenu">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<ul class="mobile-nav-list">
				<li v-for="item in toc" :key="item.id" class="mobile-nav-item">
					<a :href="`#${item.id}`" @click="closeMobileMenu">{{ item.label }}</a>
					<ul v-if="item.children" class="mobile-nav-sub">
						<li v-for="child in item.children" :key="child.id">
							<a :href="`#${child.id}`" @click="closeMobileMenu">{{ child.label }}</a>
						</li>
					</ul>
				</li>
			</ul>
		</div>

		<!-- Mobile Nav Overlay -->
		<div v-if="isMobileMenuOpen" class="mobile-nav-overlay" @click="closeMobileMenu"></div>

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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type TocItem = {
	id: string
	label: string
	children?: TocItem[]
}

const { t } = useI18n()

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
	isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
	isMobileMenuOpen.value = false
}

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
	gap: 28px;
	animation: fadeInUp 0.4s ease-out;
	padding: 24px;
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

.docs-layout {
	display: grid;
	grid-template-columns: 200px minmax(0, 1fr);
	gap: 24px;
}

.toc {
	position: sticky;
	top: 24px;
	align-self: start;
	background: #ffffff;
	border: 1px solid #e8e8e8;
	border-radius: 16px;
	padding: 16px;
	max-height: calc(100vh - 80px);
	overflow: auto;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.toc-title {
	font-weight: 700;
	font-size: 13px;
	margin-bottom: 12px;
	color: #1a1a1a;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.toc ul {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 8px;
}

.toc-item > a {
	color: #444444;
	text-decoration: none;
	font-size: 13px;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.toc-item > a::before {
	content: '';
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: #8B5CF6;
}

.toc a:hover {
	color: #8B5CF6;
}

.toc-sub {
	margin-top: 6px;
	padding-left: 16px;
	border-left: 1px solid #e8e8e8;
	display: grid;
	gap: 5px;
}

.toc-sub a {
	color: #666666;
	font-size: 12px;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.toc-sub a::before {
	content: '';
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background: #8B5CF6;
	opacity: 0.6;
}

.docs-content {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.doc-section {
	background: #ffffff;
	border: 1px solid #e8e8e8;
	border-radius: 16px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 18px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	scroll-margin-top: 60px;
}

.section-header h2 {
	margin: 0 0 6px;
	font-size: 22px;
	font-weight: 700;
	color: #1a1a1a;
}

.section-header p {
	margin: 0;
	color: #666666;
	font-size: 14px;
}

.info-card {
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	padding: 16px;
}

.info-title {
	font-weight: 700;
	margin-bottom: 8px;
	color: #1a1a1a;
	font-size: 15px;
}

.info-grid {
	margin-top: 12px;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
}

.info-label {
	font-size: 12px;
	color: #64748b;
}

.info-value {
	font-weight: 700;
	color: #1a1a1a;
	font-size: 13px;
}

.step-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 14px;
}

.step-card {
	background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
	color: #f1f5f9;
	border-radius: 14px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.step-index {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: #8B5CF6;
	font-weight: 700;
}

.step-title {
	font-weight: 600;
	font-size: 14px;
}

.step-desc {
	font-size: 12px;
	color: #94a3b8;
	line-height: 1.4;
}

.code-card {
	border-radius: 12px;
	border: 1px solid #1e293b;
	background: #0f172a;
	color: #e2e8f0;
	overflow: hidden;
}

.code-title {
	padding: 10px 14px;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	background: #1e293b;
	border-bottom: 1px solid #334155;
	color: #94a3b8;
}

.code-card pre {
	margin: 0;
	padding: 14px;
	white-space: pre-wrap;
	font-size: 12px;
	line-height: 1.5;
}

.sub-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	border-radius: 12px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	scroll-margin-top: 60px;
}

.sub-section h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 700;
	color: #1a1a1a;
}

.endpoint-card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border-radius: 10px;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
}

.endpoint {
	font-weight: 700;
	font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
	font-size: 13px;
	color: #1e293b;
}

.endpoint-meta {
	font-size: 12px;
	color: #64748b;
}

.param-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
	background: white;
	border-radius: 10px;
	overflow: hidden;
	border: 1px solid #e2e8f0;
}

.param-table th,
.param-table td {
	text-align: left;
	padding: 10px 12px;
	border-bottom: 1px solid #f1f5f9;
}

.param-table th {
	background: #f8fafc;
	font-weight: 700;
	color: #475569;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
}

.param-table tr:last-child td {
	border-bottom: none;
}

.placeholder {
	padding: 12px 14px;
	border-radius: 12px;
	border: 1px dashed #cbd5e1;
	color: #94a3b8;
	background: #f8fafc;
}

.doc-list {
	margin: 0;
	padding-left: 18px;
	color: #64748b;
	display: grid;
	gap: 8px;
	font-size: 13px;
}

.doc-list.emphasis {
	color: #1a1a1a;
	font-weight: 600;
}

@media (max-width: 1024px) {
	.api-docs {
		padding: 16px;
		overflow-x: hidden;
		min-width: 0;
		max-width: 100vw;
		box-sizing: border-box;
	}

	.docs-layout {
		grid-template-columns: 1fr;
		max-width: 100%;
		overflow-x: hidden;
	}

	.toc {
		position: relative;
		max-height: none;
		display: none;
	}

	.endpoint-card {
		flex-direction: column;
		gap: 8px;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}

	.mobile-nav-toggle {
		display: flex;
	}

	.mobile-nav-menu {
		display: block;
	}

	.mobile-nav-overlay {
		display: block;
	}
}

@media (max-width: 768px) {
	.doc-section {
		padding: 16px;
		border-radius: 12px;
	}

	.section-header h2 {
		font-size: 18px;
	}

	.section-header p {
		font-size: 13px;
	}

	.step-grid {
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.step-card {
		padding: 14px;
		border-radius: 12px;
	}

	.sub-section {
		padding: 12px;
		border-radius: 12px;
	}

	.sub-section h3 {
		font-size: 15px;
	}

	.code-card {
		border-radius: 10px;
	}

	.code-card pre {
		font-size: 11px;
		padding: 12px;
		overflow-x: auto;
	}

	.endpoint-card {
		padding: 10px 12px;
	}

	.param-table {
		font-size: 10px;
		display: block;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.param-table th,
	.param-table td {
		padding: 8px 10px;
		white-space: nowrap;
	}

	.info-card {
		padding: 14px;
		border-radius: 12px;
	}

	.info-value {
		font-size: 12px;
	}
}

@media (max-width: 480px) {
	.api-docs {
		padding: 12px;
		gap: 16px;
	}

	.doc-section {
		padding: 14px;
		gap: 14px;
	}

	.mobile-nav-toggle {
		bottom: 16px;
		right: 16px;
	}

	.section-header h2 {
		font-size: 16px;
	}

	.step-title {
		font-size: 13px;
	}

	.step-desc {
		font-size: 11px;
	}

	.code-title {
		font-size: 10px;
		padding: 8px 12px;
	}

	.endpoint {
		font-size: 12px;
	}

	.endpoint-meta {
		font-size: 11px;
	}
}

/* Mobile Navigation */
.mobile-nav-toggle {
	display: none;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 48px;
	height: 48px;
	padding: 0;
	background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
	border: none;
	border-radius: 50%;
	font-size: 14px;
	font-weight: 500;
	color: #ffffff;
	cursor: pointer;
	position: fixed;
	bottom: 24px;
	right: 24px;
	z-index: 998;
	box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.mobile-nav-toggle:hover {
	background: #fafafa;
}

.mobile-nav-menu {
	display: none;
}

.mobile-nav-overlay {
	display: none;
}

@media (max-width: 1024px) {
	.mobile-nav-toggle {
		display: flex;
	}

	.mobile-nav-menu {
		display: block;
		position: fixed;
		top: 0;
		left: -280px;
		width: 280px;
		height: 100vh;
		background: #ffffff;
		z-index: 1000;
		overflow-y: auto;
		transition: left 0.3s ease;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
	}

	.mobile-nav-menu.open {
		left: 0;
	}

	.mobile-nav-overlay {
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.mobile-nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e8e8e8;
		font-weight: 600;
		font-size: 16px;
	}

	.mobile-nav-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: #666;
	}

	.mobile-nav-list {
		list-style: none;
		padding: 12px 0;
		margin: 0;
	}

	.mobile-nav-item {
		padding: 0;
	}

	.mobile-nav-item > a {
		display: block;
		padding: 12px 20px;
		color: #1a1a1a;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
	}

	.mobile-nav-item > a:hover {
		background: #f5f5f5;
	}

	.mobile-nav-sub {
		list-style: none;
		padding: 0;
		margin: 0;
		background: #fafafa;
	}

	.mobile-nav-sub li a {
		display: block;
		padding: 10px 20px 10px 36px;
		color: #666666;
		text-decoration: none;
		font-size: 13px;
	}

	.mobile-nav-sub li a:hover {
		background: #f0f0f0;
		color: #1a1a1a;
	}

	/* 确保手机端内容不超出屏幕 */
	.api-docs {
		max-width: 100vw;
		overflow-x: hidden;
	}

	.docs-content {
		max-width: 100%;
		overflow-x: hidden;
	}

	.doc-section {
		max-width: 100%;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	.param-table {
		max-width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.code-card {
		max-width: 100%;
		overflow-x: auto;
	}

	.code-card pre {
		max-width: 100%;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.step-grid {
		max-width: 100%;
		overflow-x: hidden;
	}

	.info-card {
		max-width: 100%;
		overflow-x: hidden;
		box-sizing: border-box;
	}
}
</style>
