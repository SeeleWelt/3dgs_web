<template>
  <a-modal
    v-model:open="visible"
    title="自定义运镜"
    :width="1200"
    :footer="null"
    :mask-closable="false"
    class="custom-motion-modal"
    @cancel="handleCancel"
  >
    <div class="custom-motion-container" ref="containerRef" @mousemove="handleMouseMove">
      <!-- 左侧预览区域 -->
      <div class="preview-panel">
        <div
          class="viewer-container"
          :style="{ backgroundColor: viewerControls.backgroundColor }"
        >
          <canvas id="custom-motion-canvas" ref="canvasRef"></canvas>

          <div v-if="isViewerLoading" class="loading-overlay">
            <div class="loading-spinner" :class="{ 'success': loading_status === 'success', 'fail': loading_status === 'fail' }"></div>
            <p class="loading-text">
              <template v-if="loading_status === ''">加载中...{{ loading_progress }}%</template>
              <template v-else-if="loading_status === 'success'">加载成功！</template>
              <template v-else-if="loading_status === 'fail'">加载失败，请重试</template>
            </p>
            <button v-if="loading_status === 'fail'" class="retry-btn" @click="retryLoadModel">重试加载</button>
          </div>
        </div>

        <!-- 底部控制栏 -->
        <div class="bottom-controls" :class="{ visible: showControls }">
          <!-- 进度条 -->
          <div class="progress-section" v-if="totalDuration > 0">
            <div class="progress-time">
              <span class="current-time">{{ playProgress.toFixed(1) }}s</span>
              <span class="total-time">/ {{ totalDuration.toFixed(1) }}s</span>
            </div>
            <a-slider
              v-model:value="playProgress"
              :min="0"
              :max="totalDuration"
              :step="0.1"
              :disabled="!skullEntity || !viewerControls.isOrbitMode"
              @change="handleOrbitProgressChange"
              @afterChange="handleOrbitProgressAfterChange"
              class="orbit-slider"
            />
          </div>

          <div class="control-buttons">
            <div class="btn-group left">
              <a-tooltip :title="isLoopPlaying ? '暂停' : '播放'">
                <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="toggleLoopPlay" :disabled="!skullEntity || !viewerControls.isOrbitMode">
                  <template #icon>
                    <PauseOutlined v-if="isLoopPlaying" />
                    <CaretRightOutlined v-else />
                  </template>
                  {{ isLoopPlaying ? '暂停' : '播放' }}
                </a-button>
              </a-tooltip>
              <a-tooltip title="重置视角">
                <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="resetCamera" :disabled="!skullEntity">
                  <template #icon><ReloadOutlined /></template>
                  重置
                </a-button>
              </a-tooltip>
              <a-tooltip title="操作说明">
                <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="showGestureModal = true">
                  <template #icon><QuestionCircleOutlined /></template>
                  说明
                </a-button>
              </a-tooltip>
            </div>
            <div class="btn-group right">
              <a-tooltip title="切换飞行模式">
                <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="toggleMode" :disabled="!skullEntity">
                  <template #icon><AimOutlined /></template>
                  {{ viewerControls.isOrbitMode ? '轨道' : '飞行' }}
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>

        <!-- 模式提示 -->
        <div v-if="!viewerControls.isOrbitMode" class="mode-tip fly-mode">
          <span class="mode-icon">✈️</span>
          <span>飞行模式</span>
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-panel">
        <div class="config-header">
          <span class="config-title">运镜配置</span>
        </div>

        <div class="config-content">
          <!-- 当前相机位置 -->
          <div class="config-section">
            <div class="section-title">当前相机位置</div>
            <div class="camera-position-display">
              <div class="position-item">
                <span class="position-label">X:</span>
                <span class="position-value">{{ currentCameraPos.x.toFixed(2) }}</span>
              </div>
              <div class="position-item">
                <span class="position-label">Y:</span>
                <span class="position-value">{{ currentCameraPos.y.toFixed(2) }}</span>
              </div>
              <div class="position-item">
                <span class="position-label">Z:</span>
                <span class="position-value">{{ currentCameraPos.z.toFixed(2) }}</span>
              </div>
            </div>
            <a-button type="primary" block @click="saveCurrentPosition" class="snapshot-btn">
              <template #icon><CameraOutlined /></template>
              快照保存当前位置
            </a-button>
          </div>

          <!-- 关键帧列表 -->
          <div class="config-section">
            <div class="section-title">关键帧 ({{ displayKeyframes.length }})</div>
            <div class="keyframes-list" v-if="displayKeyframes.length > 0">
              <div
                v-for="(kf, index) in displayKeyframes"
                :key="index"
                class="keyframes-item"
                :class="{
                  active: index < keyframes.length && selectedKeyframeIndex === index,
                  dragging: index < keyframes.length && dragIndex === index,
                  'drag-over': index < keyframes.length && dragOverIndex === index,
                  'closed-loop-end': closedLoop && index === keyframes.length
                }"
                :draggable="index < keyframes.length"
                @click="index < keyframes.length && selectKeyframe(index)"
                @dragstart="index < keyframes.length && handleDragStart($event, index)"
                @dragend="handleDragEnd"
                @dragover.prevent="index < keyframes.length && handleDragOver($event, index)"
                @dragleave="handleDragLeave"
                @drop="index < keyframes.length && handleDrop($event, index)"
              >
                <div class="keyframes-index">
                  {{ index < keyframes.length ? index + 1 : '↺' }}
                </div>
                <div class="keyframes-info">
                  <div class="keyframes-position">
                    X:{{ kf.position.x.toFixed(1) }} Y:{{ kf.position.y.toFixed(1) }} Z:{{ kf.position.z.toFixed(1) }}
                  </div>
                  <div v-if="closedLoop && index === keyframes.length" class="keyframes-loop-label">
                    返回起点
                  </div>
                  <div v-if="index < keyframes.length && kf.time !== undefined && kf.time !== null" class="keyframes-duration">
                    <span class="duration-label">到下一帧:</span>
                    <a-input-number
                      v-model:value="keyframes[index].time"
                      :min="0.5"
                      :max="30"
                      :step="0.5"
                      size="small"
                      style="width: 70px"
                      @click.stop
                      @change="handleTimeChange"
                    />
                    <span class="duration-unit">秒</span>
                  </div>
                </div>
                <div class="keyframes-actions" v-if="index < keyframes.length">
                  <a-tooltip title="更新位置">
                    <a-button type="text" size="small" @click.stop="updateKeyframePosition(index)">
                      <template #icon><CameraOutlined /></template>
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="预览">
                    <a-button type="text" size="small" @click.stop="previewKeyframe(index)">
                      <template #icon><EyeOutlined /></template>
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button type="text" size="small" danger @click.stop="deleteKeyframe(index)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
            </div>
            <div v-else class="keyframes-empty">
              <p>暂无关键帧</p>
              <p class="empty-hint">点击上方"快照保存当前位置"按钮添加关键帧</p>
            </div>
          </div>

          <!-- 运镜设置 -->
          <div class="config-section">
            <div class="section-title">运镜设置</div>
            <div class="setting-row">
              <span class="setting-label">插值方式</span>
              <a-select v-model:value="interpolationType" style="width: 120px" size="small">
                <a-select-option value="linear">线性</a-select-option>
                <a-select-option value="easeIn">缓入</a-select-option>
                <a-select-option value="easeOut">缓出</a-select-option>
                <a-select-option value="easeInOut">缓入缓出</a-select-option>
              </a-select>
            </div>
            <div class="setting-row">
              <span class="setting-label">循环播放</span>
              <a-switch v-model:checked="loopPlay" />
            </div>
            <div class="setting-row">
              <span class="setting-label">闭环播放</span>
              <a-checkbox v-model:checked="closedLoop" :disabled="keyframes.length < 3">自动回到起点</a-checkbox>
            </div>
            <div class="setting-row" v-if="keyframes.length >= 2">
              <span class="setting-label">总时长</span>
              <span class="total-duration">{{ totalDuration.toFixed(1) }}秒</span>
            </div>
            <div class="preview-btn-wrapper">
              <a-button
                type="primary"
                block
                @click="togglePreviewMode"
                :disabled="!skullEntity || keyframes.length < 2"
              >
                <template #icon><PlayCircleOutlined /></template>
                {{ isPreviewMode ? '停止预览' : '预览轨迹' }}
              </a-button>
            </div>
          </div>
        </div>

        <div class="config-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleConfirm">确认</a-button>
        </div>
      </div>
    </div>

    <!-- 自定义运镜使用说明对话框 -->
    <a-modal
      v-model:open="showGestureModal"
      title="自定义运镜使用说明"
      :footer="null"
      :mask-closable="true"
      width="560px"
      class="gesture-modal"
    >
      <div class="gesture-content">
        <!-- 第一步：添加关键帧 -->
        <div class="gesture-section">
          <div class="gesture-section-title">
            <CameraOutlined /> 添加关键帧
          </div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #e6f7ff; color: #1890ff;">
                <CameraOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">快照保存当前位置</div>
                <div class="gesture-detail">调整相机位置后，点击按钮添加关键帧</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 第二步：关键帧操作 -->
        <div class="gesture-section">
          <div class="gesture-section-title">
            <ToolOutlined /> 关键帧操作
          </div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #fff7e6; color: #fa8c16;">
                <ReloadOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">更新位置</div>
                <div class="gesture-detail">将关键帧位置更新为当前相机位置</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #f6ffed; color: #52c41a;">
                <EyeOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">预览关键帧</div>
                <div class="gesture-detail">跳转到指定关键帧位置查看效果</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #fff1f0; color: #ff4d4f;">
                <DeleteOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">删除关键帧</div>
                <div class="gesture-detail">移除选中的关键帧</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #f0f5ff; color: #2f54eb;">
                <DragOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">拖拽排序</div>
                <div class="gesture-detail">拖拽关键帧调整播放顺序</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 第三步：时间设置 -->
        <div class="gesture-section">
          <div class="gesture-section-title">
            <ClockCircleOutlined /> 时间设置
          </div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #f9f0ff; color: #722ed1;">
                <NumberOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">设置持续时间</div>
                <div class="gesture-detail">修改每个关键帧到下一帧的时间（0.5-30秒）</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 第四步：预览与播放 -->
        <div class="gesture-section">
          <div class="gesture-section-title">
            <PlayCircleOutlined /> 预览与播放
          </div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #fff7e6; color: #fa8c16;">
                <CaretRightOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">播放/暂停</div>
                <div class="gesture-detail">预览完整运镜效果</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #e6f7ff; color: #1890ff;">
                <PlayCircleOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">预览轨迹</div>
                <div class="gesture-detail">显示完整运动路径和相机模型</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #f6ffed; color: #52c41a;">
                <SwapOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">循环播放</div>
                <div class="gesture-detail">开启后播放完成后从头开始</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #fff1f0; color: #ff4d4f;">
                <SyncOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">闭环播放</div>
                <div class="gesture-detail">自动从终点返回起点（需3个以上关键帧）</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 运镜设置 -->
        <div class="gesture-section">
          <div class="gesture-section-title">
            <SettingOutlined /> 运镜设置
          </div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon" style="background: #f0f5ff; color: #2f54eb;">
                <LineChartOutlined />
              </div>
              <div class="gesture-text">
                <div class="gesture-action">插值方式</div>
                <div class="gesture-detail">linear: 线性 | easeIn: 缓入 | easeOut: 缓出 | easeInOut: 缓入缓出</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </a-modal>
</template>

<script>
import * as pc from 'playcanvas';
import CameraControls from '@/utils/controller';
import { loadGsplat } from '@/utils/load';
import { message } from 'ant-design-vue';
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';
import { applyTimedPathMotion, Easing } from '@/utils/camera-motions';
import { Annotation, AnnotationManager } from '../../scripts/esm/annotations.mjs';
import {
  SwapOutlined,
  ZoomInOutlined,
  DragOutlined,
  ArrowUpOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  CameraOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  PauseOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
  AimOutlined,
  PlayCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  NumberOutlined,
  SyncOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons-vue';

const showToast = (input) => {
  const defaultDuration = 2;
  if (typeof input === 'string') {
    message.info(input, defaultDuration);
    return;
  }
  const content = input?.message || '操作提示';
  const duration = typeof input?.duration === 'number' ? input.duration / 1000 : defaultDuration;
  switch (input?.type) {
    case 'success':
      message.success(content, duration);
      break;
    case 'error':
      message.error(content, duration);
      break;
    case 'warning':
      message.warning(content, duration);
      break;
    default:
      message.open({ content, duration });
      break;
  }
};

const pickDepthGlsl = /* glsl */ `
vec4 packFloat(float depth) {
    uvec4 u = (uvec4(floatBitsToUint(depth)) >> uvec4(0u, 8u, 16u, 24u)) & 0xffu;
    return vec4(u) / 255.0;
}
vec4 getPickOutput() {
    return packFloat(gl_FragCoord.z);
}
`;

export default {
  name: 'CustomMotion',
  components: {
    SwapOutlined,
    ZoomInOutlined,
    DragOutlined,
    ArrowUpOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    CameraOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
    PauseOutlined,
    CaretRightOutlined,
    QuestionCircleOutlined,
    AimOutlined,
    PlayCircleOutlined,
    ToolOutlined,
    ClockCircleOutlined,
    NumberOutlined,
    SyncOutlined,
    SettingOutlined,
    LineChartOutlined,
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
    taskId: {
      type: String,
      required: true
    },
    customMotion: {
      type: Object,
      default: () => null
    },
    initialCameraPos: {
      type: Object,
      default: () => null
    },
    modelArrayBuffer: {
      type: [ArrayBuffer, Uint8Array, Object],
      default: () => null
    }
  },
  emits: ['update:open', 'confirm'],
  data() {
    return {
      visible: false,
      // 渲染相关
      containerRef: null,
      canvasRef: null,
      app: null,
      device: null,
      cameraEntity: null,
      cameraControls: null,
      skullEntity: null,
      gridEntity: null,
      trajectoryEntity: null,

      isViewerLoading: false,
      loading_progress: 0,
      loading_status: '',

      // 视图控制
      viewerControls: {
        showInfo: false,
        isOrbitMode: true,
        moveSpeed: 2,
        orbitSpeed: 18,
        autoRotateSpeed: 30,
        pinchSpeed: 0.4,
        originalFov: 75,
        backgroundColor: '#000000'
      },
      showControls: true,
      controlsHideTimer: null,

      // 相机位置
      currentCameraPos: { x: 0, y: 0, z: 0 },

      // 关键帧（只需要位置）
      keyframes: [],
      selectedKeyframeIndex: -1,
      dragIndex: -1,
      dragOverIndex: -1,

      // 运镜设置
      interpolationType: 'easeInOut',
      loopPlay: true,
      closedLoop: false,

      // 播放状态
      isLoopPlaying: false,
      isPreviewMode: false,
      playProgress: 0,
      lastPlayProgress: 0, // 保存暂停时的进度
      previewProgress: 0,
      previewAnimationFrame: null,
      originalZoomRange: null, // 保存原始zoomRange
      _isDraggingSlider: false, // 是否正在拖动进度条

      // 预览标记实体
      previewCameraMarker: null,
      previewTrajectoryEntity: null,

      // 标注相关
      annotationManager: null,
      defaultAnnotationEntity: null,
      keyframeAnnotationEntities: [],

      // UI状态
      showGestureModal: false,
      isMobile: false,

      // 任务信息
      task_id: this.taskId,
      task_name: '',
      fileName: '',
      cameraData: {},

      // 初始相机位置（用于重置）
      initialCameraPose: null,

      resizeHandler: null,
      modelLoaded: false,
    };
  },
  computed: {
    // 显示用的关键帧列表（闭环时在最后添加起点作为终点）
    displayKeyframes() {
      if (this.closedLoop && this.keyframes.length >= 3) {
        // 复制关键帧并在最后添加起点
        const displayList = this.keyframes.map(kf => ({ ...kf }));
        // 最后一个是返回起点，不需要time
        displayList.push({ ...this.keyframes[0], time: null });
        return displayList;
      }
      return this.keyframes;
    },
    // 计算总时长
    // 非闭环：time表示到下一个关键帧的时间，最后一个关键帧的time没有用
    // 闭环：所有关键帧的time都有用（最后一个到第一个）
    totalDuration() {
      if (this.keyframes.length < 2) return 0;
      // 非闭环模式下，最后一个关键帧的时间不计入总时长
      const count = this.closedLoop ? this.keyframes.length : this.keyframes.length - 1;
      let total = 0;
      for (let i = 0; i < count; i++) {
        const kf = this.keyframes[i];
        total += kf?.time || 0;
      }
      return total;
    }
  },
  watch: {
    open(val) {
      this.visible = val;
      if (val && !this.modelLoaded) {
        this.$nextTick(() => {
          this.initViewer();
        });
      } else if (val && this.modelLoaded && this.initialCameraPose && this.keyframes.length >= 2) {
        // 如果模型已加载且有关键帧，绘制轨迹
        this.$nextTick(() => {
          this.updateTrajectory();
        });
      }
    },
    visible(val) {
      this.$emit('update:open', val);
      // 关闭时完全销毁 viewer
      if (!val) {
        this.destroyViewer();
        this.resetState();
      }
    },
    closedLoop() {
      // 闭环模式变化时更新轨迹
      if (this.keyframes.length >= 2 && this.modelLoaded) {
        this.$nextTick(() => {
          this.updateTrajectory();
        });
      }
    }
  },
  mounted() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  beforeUnmount() {
    // 清理节流定时器
    if (this._sliderThrottleId) {
      cancelAnimationFrame(this._sliderThrottleId);
      this._sliderThrottleId = null;
    }
    this.destroyViewer();
  },
  methods: {
    // 重置状态（每次关闭后重新打开时使用）
    resetState() {
      this.modelLoaded = false;
      this.keyframes = [];
      this.selectedKeyframeIndex = -1;
      this.interpolationType = 'easeInOut';
      this.loopPlay = true;
      this.closedLoop = false;
      this.isLoopPlaying = false;
      this.isPreviewMode = false;
      this.playProgress = 0;
      this.lastPlayProgress = 0;
      this.previewProgress = 0;
      this.initialCameraPose = null;
      this.cameraData = {};
    },

    // 加载自定义运镜参数
    loadCustomMotion() {
      if (this.customMotion) {
        this.keyframes = this.customMotion.keyframes || [];
        // 确保每个关键帧都有time属性（到下一个关键帧的时间）
        this.keyframes.forEach((kf, index) => {
          if (kf.time === undefined || kf.time === null) {
            kf.time = 3; // 默认为3秒
          }
        });
        this.interpolationType = this.customMotion.interpolationType || 'easeInOut';
        this.loopPlay = this.customMotion.loopPlay !== false;
        this.closedLoop = this.customMotion.closedLoop || false;
        // 模型加载且焦点设置后绘制轨迹
        if (this.skullEntity && this.initialCameraPose) {
          this.$nextTick(() => {
            this.updateTrajectory();
          });
        }
      }
    },

    // 切换飞行/轨道模式
    toggleMode() {
      this.viewerControls.isOrbitMode = !this.viewerControls.isOrbitMode;
      if (this.cameraControls) {
        this.cameraControls.mode = this.viewerControls.isOrbitMode ? 'orbit' : 'fly';
      }
      if (!this.viewerControls.isOrbitMode) {
        this.stopPlayback();
      }
    },

    // 确认
    handleConfirm() {
      if (this.keyframes.length < 2) {
        showToast({ type: 'warning', message: '请至少添加2个关键帧' });
        return;
      }
      const motionData = {
        keyframes: this.keyframes,
        interpolationType: this.interpolationType,
        loopPlay: this.loopPlay,
        closedLoop: this.closedLoop
      };
      this.$emit('confirm', motionData);
      this.visible = false;
    },

    // 取消
    handleCancel() {
      this.visible = false;
    },

    // 初始化渲染器
    async initViewer() {
      if (this.app) return;

      const container = this.$refs.containerRef;
      if (!container) return;

      this.canvas = document.getElementById('custom-motion-canvas');
      if (!this.canvas) {
        showToast({ type: 'error', message: '获取渲染画布失败' });
        return;
      }

      this.canvas.focus();
      const gfxOptions = {
        deviceTypes: ['webgl2'],
        antialias: false
      };

      try {
        this.device = await pc.createGraphicsDevice(this.canvas, gfxOptions);
        this.device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

        const createOptions = new pc.AppOptions();
        createOptions.graphicsDevice = this.device;
        createOptions.mouse = new pc.Mouse(this.canvas);
        createOptions.touch = new pc.TouchDevice(this.canvas);
        createOptions.keyboard = new pc.Keyboard(window);
        createOptions.componentSystems = [
          pc.RenderComponentSystem,
          pc.CameraComponentSystem,
          pc.LightComponentSystem,
          pc.ScriptComponentSystem,
          pc.GSplatComponentSystem,
          pc.ModelComponentSystem,
        ];
        createOptions.resourceHandlers = [
          pc.TextureHandler,
          pc.ContainerHandler,
          pc.ScriptHandler,
          pc.GSplatHandler
        ];

        this.app = new pc.AppBase(this.canvas);
        this.app.init(createOptions);
        this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

        this.app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

        // 创建相机
        this.cameraEntity = new pc.Entity('custom-motion-camera');
        this.cameraEntity.addComponent('camera', {
          fov: this.viewerControls.originalFov,
          frustumCulling: true,
          clearColor: new pc.Color(0, 0, 0, 1)
        });
        this.app.root.addChild(this.cameraEntity);

        // 创建相机控制器
        this.cameraControls = new CameraControls(this.app, this.cameraEntity.camera, null);
        this.updateCameraControls();

        // 创建灯光
        const lightEntity = new pc.Entity('custom-motion-light');
        lightEntity.addComponent('light', {
          type: 'directional',
          shadowBias: 0.2,
          shadowResolution: 2048
        });
        this.app.root.addChild(lightEntity);

        // 创建网格
        const gridEntity = new pc.Entity('custom-motion-grid');
        gridEntity.addComponent('script');
        this.app.root.addChild(gridEntity);
        this.gridEntity = gridEntity;

        this.app.start();
        this.app.on('update', this.handleUpdate);

        // 加载模型
        await this.loadModel();
        this.modelLoaded = true;

        // 加载自定义运镜参数
        this.loadCustomMotion();
      } catch (error) {
        showToast({ type: 'error', message: `初始化渲染器失败：${error.message}` });
        console.error('PlayCanvas初始化失败：', error);
      }
    },

    // 加载模型
    async loadModel() {
      try {
        
        let arrayBuffer = this.modelArrayBuffer;

        // 如果没有传入arrayBuffer，则从服务器获取
        if (!arrayBuffer) {
          this.isViewerLoading = true;
          const response = await ApiServer.request({
            method: 'post',
            url: `${API.TASK_DETAIL}/${this.task_id}/download-token`
          });
          const download_token = response.data.token;

          const response1 = await ApiServer.request({
            method: 'get',
            url: `${API.DOWNLOAD_MODEL}/${this.task_id}`,
            params: {
              format: 'sog',
              token: download_token
            },
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                this.loading_progress = Number.parseFloat((progressEvent.loaded / progressEvent.total * 100).toFixed(2));
              }
            }
          });

          arrayBuffer = response1.data;
        }

        const fileName = `${this.task_name || 'model'}.sog`;
        await this.renderFromArrayBuffer(fileName, arrayBuffer);
        this.showControlsTimer();
      } catch (error) {
        this.isViewerLoading = false;
        this.loading_status = 'fail';
        console.error('加载模型失败：', error);
      }
    },

    // 从ArrayBuffer渲染模型
    async renderFromArrayBuffer(fileName, arrayBuffer) {
      try {
        if (this.skullEntity && this.app) {
          this.app.root.removeChild(this.skullEntity);
          this.skullEntity.destroy();
          this.skullEntity = null;
        }

        const blob = new Blob([arrayBuffer]);
        const fileUrl = URL.createObjectURL(blob);
        await this.loadSplatAsset(fileName, fileUrl);
      } catch (error) {
        this.isViewerLoading = false;
        console.log(`解析模型失败：${error.message}`);
      }
    },

    // 加载splat资产
    async loadSplatAsset(fileName, fileUrl) {
      if (!this.app) {
        this.isViewerLoading = false;
        return;
      }

      let splatAsset = await loadGsplat(this.app.assets, {
        filename: fileName,
        url: fileUrl,
      });

      this.skullEntity = new pc.Entity('custom-motion-splat');
      this.skullEntity.addComponent('gsplat', { asset: splatAsset });
      this.app.root.addChild(this.skullEntity);

      // 聚焦到模型 - 优先使用传入的cameraPose，否则从服务器获取
      if (this.skullEntity) {
        let cameraPose;
        if (this.initialCameraPos) {
          // 使用传入的cameraPose (包含cameraPosition和focus)
          const pos = this.initialCameraPos.cameraPosition || this.initialCameraPos.position;
          const focus = this.initialCameraPos.focus;
          const position = new pc.Vec3(pos.x, pos.y, pos.z);
          const focusVec = new pc.Vec3(focus.x, focus.y, focus.z);

          const direction = position.clone().sub(focusVec);
          cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, direction);
          this.initialCameraPose = this.initialCameraPos;
        } else {
          // 从服务器获取相机数据
          await this.getCameraData();
          const vec = this.cameraDataToVector(this.cameraData);
          cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, vec);
          this.initialCameraPose = cameraPose;
        }
        this.updateCurrentCameraPos();

        // 设置网格位置
        const aabb = this.cameraControls?.calculateEntityAabb(this.skullEntity);
        if (aabb && this.gridEntity) {
          const bottomPose = aabb.center.clone().sub(new pc.Vec3(0, aabb.halfExtents.y, 0));
          this.gridEntity.setPosition(bottomPose);
        }
              // 初始化标注管理器
        this.initAnnotationManager();
      }

      URL.revokeObjectURL(fileUrl);
      this.loading_status = 'success';
      this.isViewerLoading = false;



      // 模型加载完成后绘制轨迹
      if (this.keyframes.length >= 2) {
        this.$nextTick(() => {
          this.updateTrajectory();
        });
      }
    },

    // 初始化标注管理器
    initAnnotationManager() {
      try {
        if (!this.skullEntity || !this.app) return;

        // 添加script组件到模型实体
        if (!this.skullEntity.script) {
          this.skullEntity.addComponent('script');
        }
        if(this.skullEntity.script.annotationManager)
        {
          console.log("管理系统已经存在了");
          this.annotationManager = this.skullEntity.script.annotationManager
        }
        // 创建独立的标注管理器（与RenderTask中的管理器分开）
        else this.annotationManager = this.skullEntity.script.create(AnnotationManager);

        // 创建默认标注（永远不删除）
        const focus = this.getModelCenter();
        if (focus) {
          this.defaultAnnotationEntity = new pc.Entity('annotation_default');
          this.defaultAnnotationEntity.setPosition(focus);
          this.defaultAnnotationEntity.addComponent('script');
          this.defaultAnnotationEntity.script.create(Annotation, {
            properties: {
              label: String(0),
              title: '默认标注',
              text: '',
              size: 0.01
            }
          });
          this.app.root.addChild(this.defaultAnnotationEntity);
        }

        console.log('AnnotationManager 初始化成功');
      } catch (e) {
        console.error('初始化AnnotationManager失败:', e);
      }
    },

    // 创建关键帧标注
    createKeyframeAnnotations() {
      try {
        if (!this.app || !this.annotationManager || this.keyframes.length < 2) return;

        // 清除旧的标注
        this.clearKeyframeAnnotations();

        // 为每个关键帧创建标注
        this.keyframes.forEach((kf, index) => {
          try {
            const kfPos = new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);

            const annotationEntity = new pc.Entity(`keyframe_annotation_${index}`);
            annotationEntity.setPosition(kfPos);
            annotationEntity.addComponent('script');
            annotationEntity.script.create(Annotation, {
              properties: {
                label: String(index + 1),
                title: `关键帧 ${index + 1}`,
                text: '',
                size: 1
              }
            });

            this.app.root.addChild(annotationEntity);
            this.keyframeAnnotationEntities.push(annotationEntity);
          } catch (e) {
            console.error(`创建关键帧标注 ${index} 失败:`, e);
          }
        });
      } catch (e) {
        console.error('创建关键帧标注失败:', e);
      }
    },

    // 清除关键帧标注
    clearKeyframeAnnotations() {
      if (!this.app) return;

      this.keyframeAnnotationEntities.forEach(entity => {
        if (entity) {
          // 先从场景中移除
          if (entity.parent) {
            entity.parent.removeChild(entity);
          }
          // 销毁实体
          entity.destroy();
        }
      });
      this.keyframeAnnotationEntities = [];
    },

    // 获取相机数据
    async getCameraData() {
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: API.GET_CAMERA_DATA,
          params: {
            task_id: this.task_id
          }
        });
        this.cameraData = response.data.data || {};
      } catch (error) {
        console.error('获取相机数据失败：', error);
      }
    },

    // 相机数据转向量
    quatRotateVector(q) {
      const [qx, qy, qz, qw] = q;
      const [vx, vy, vz] = [0, 0, -1];
      const x = vx * (1 - 2 * qy * qy - 2 * qz * qz) + vy * (2 * qx * qy - 2 * qz * qw) + vz * (2 * qx * qz + 2 * qy * qw);
      const y = vx * (2 * qx * qy + 2 * qz * qw) + vy * (1 - 2 * qx * qx - 2 * qz * qz) + vz * (2 * qy * qz - 2 * qx * qw);
      const z = vx * (2 * qx * qz - 2 * qy * qw) + vy * (2 * qy * qz + 2 * qx * qw) + vz * (1 - 2 * qx * qx - 2 * qy * qy);
      return new pc.Vec3([x, y, z]);
    },

    cameraDataToVector(cameraData) {
      if (!cameraData || !cameraData[0] || !cameraData[0].quaternion) {
        return new pc.Vec3(0, 0, 1);
      }
      return this.quatRotateVector(cameraData[0].quaternion);
    },

    // 更新当前相机位置
    updateCurrentCameraPos() {
      if (this.cameraEntity) {
        const pos = this.cameraEntity.getPosition();
        this.currentCameraPos = { x: pos.x, y: pos.y, z: pos.z };
      }
    },

    // 保存当前相机位置
    saveCurrentPosition() {
      const pos = { ...this.currentCameraPos };
      // time表示到下一个关键帧的运动时间，第一个关键帧默认为3秒
      const time = this.keyframes.length === 0 ? 3 : 3;
      const newKeyframe = {
        position: pos,
        time: time
      };
      this.keyframes.push(newKeyframe);
      this.updateTrajectory();
      showToast({ type: 'success', message: `已添加关键帧 ${this.keyframes.length}` });
    },

    // 更新轨迹线 - 使用 applyPathMotion 计算实际路径
    updateTrajectory() {
      try {
        if (!this.app || this.keyframes.length < 2) {
          this.clearTrajectory();
          return;
        }

        // 预览模式下不显示主轨迹（预览模式有自己的轨迹）
        if (this.isPreviewMode) {
          this.clearTrajectory();
          return;
        }

        // 清除旧轨迹
        this.clearTrajectory();

      // 构建路径点（直接使用关键帧位置）
      const pathPoints = this.keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      // 闭环模式：添加起点到末尾形成闭环
      if (this.closedLoop && this.keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      // 构建每段时间数组
      const segmentCount = this.closedLoop ? this.keyframes.length : this.keyframes.length - 1;
      const durations = [];
      for (let i = 0; i < segmentCount; i++) {
        durations.push(this.keyframes[i]?.time || 3);
      }

      // 获取缓动函数
      const easingFn = this.getEasingFunction(this.interpolationType);

      // 使用 applyTimedPathMotion 计算轨迹点
      const pathPositions = [];
      const numPoints = 200; // 轨迹分辨率
      const totalTime = durations.reduce((a, b) => a + b, 0);

      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * totalTime;

        // 使用 applyTimedPathMotion 直接计算位置
        const targetPos = applyTimedPathMotion(pathPoints, t, durations, easingFn);

        pathPositions.push(targetPos);
      }

      // 构建线段顶点数据（非索引方式：每两个连续点重复存储）
      const positions = [];
      const colors = [];
      for (let i = 0; i < pathPositions.length - 1; i++) {
        const p1 = pathPositions[i];
        const p2 = pathPositions[i + 1];
        const t1 = i / (pathPositions.length - 1);
        const t2 = (i + 1) / (pathPositions.length - 1);

        // 点1
        positions.push(p1.x, p1.y, p1.z);
        colors.push(t1, 1 - t1, 1, 1);

        // 点2
        positions.push(p2.x, p2.y, p2.z);
        colors.push(t2, 1 - t2, 1, 1);
      }

      // 创建顶点格式
      const vertexFormat = new pc.VertexFormat(this.app.graphicsDevice, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_FLOAT32 }
      ]);

      // 创建顶点缓冲区
      const numVertices = positions.length / 3;
      const vertexBuffer = new pc.VertexBuffer(this.app.graphicsDevice, vertexFormat, numVertices);
      const iterator = new pc.VertexIterator(vertexBuffer);

      for (let i = 0; i < numVertices; i++) {
        iterator.element[pc.SEMANTIC_POSITION].set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        iterator.element[pc.SEMANTIC_COLOR].set(colors[i * 4], colors[i * 4 + 1], colors[i * 4 + 2], colors[i * 4 + 3]);
        iterator.next();
      }
      iterator.end();

      // 创建 mesh - 非索引绘制
      const mesh = new pc.Mesh(this.app.graphicsDevice);
      mesh.vertexBuffer = vertexBuffer;
      mesh.primitive[0].type = pc.PRIMITIVE_LINES;
      mesh.primitive[0].base = 0;
      mesh.primitive[0].count = numVertices;
      mesh.primitive[0].indexed = false;

      // 创建材质
      const material = new pc.StandardMaterial();
      material.emissive = new pc.Color(0, 0.8, 1);
      material.emissiveVertexColor = true;
      material.useLighting = false;
      material.update();

      // 创建 render component
      const meshInstance = new pc.MeshInstance(mesh, material);

      // 创建轨迹线实体
      this.trajectoryEntity = new pc.Entity('trajectory');
      this.trajectoryEntity.addComponent('render', {
        meshInstances: [meshInstance]
      });
      this.app.root.addChild(this.trajectoryEntity);

      // 创建关键帧标注
      this.createKeyframeAnnotations();

      console.log('轨迹绘制完成，顶点数:', numVertices, '焦点:', focus);
      } catch (e) {
        console.error('更新轨迹失败:', e);
      }
    },

    // 清除轨迹线
    clearTrajectory() {
      if (this.trajectoryEntity && this.app) {
        this.app.root.removeChild(this.trajectoryEntity);
        this.trajectoryEntity.destroy();
        this.trajectoryEntity = null;
      }
      // 清除关键帧标注
      this.clearKeyframeAnnotations();
    },

    // 获取模型中心
    getModelCenter() {  
      if (!this.skullEntity) return null;
      // 优先使用 initialCameraPose
      if (this.initialCameraPose) {
        return this.initialCameraPose.focus.clone();
      }
      // 备用：计算模型的 AABB 中心
      if (this.cameraControls) {
        const aabb = this.cameraControls.calculateEntityAabb(this.skullEntity);
        if (aabb) {
          return aabb.center.clone();
        }
      }
      return null;
    },

    // 选择关键帧
    selectKeyframe(index) {
      this.selectedKeyframeIndex = index;
    },

    // 预览关键帧
    previewKeyframe(index) {
      if (!this.cameraControls || !this.keyframes[index]) return;
      const kf = this.keyframes[index];
      const kfPos = new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      const focus = this.getModelCenter();
        this.cameraControls.reset(focus, kfPos, { duration: 0.5 });
    },

    // 更新关键帧位置为当前相机位置
    updateKeyframePosition(index) {
      if (!this.keyframes[index]) return;
      // 获取当前相机位置
      const pos = { ...this.currentCameraPos };
      this.keyframes[index].position = pos;
      // 更新轨迹显示
      this.updateTrajectory();
      showToast({ type: 'success', message: `已更新关键帧 ${index + 1} 位置` });
    },

    // 删除关键帧
    deleteKeyframe(index) {
      this.keyframes.splice(index, 1);
      if (this.selectedKeyframeIndex === index) {
        this.selectedKeyframeIndex = -1;
      } else if (this.selectedKeyframeIndex > index) {
        this.selectedKeyframeIndex--;
      }
      this.updateTrajectory();
    },

    // 关键帧时间变化
    handleTimeChange() {
      // 更新轨迹显示
      this.updateTrajectory();
    },

    // 拖拽开始
    handleDragStart(event, index) {
      this.dragIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index);
      // 添加半透明效果
      event.target.style.opacity = '0.5';
    },

    // 拖拽结束
    handleDragEnd(event) {
      this.dragIndex = -1;
      this.dragOverIndex = -1;
      event.target.style.opacity = '1';
    },

    // 拖拽经过
    handleDragOver(event, index) {
      if (this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
    },

    // 拖拽离开
    handleDragLeave(event) {
      this.dragOverIndex = -1;
    },

    // 放置
    handleDrop(event, targetIndex) {
      event.preventDefault();
      const sourceIndex = this.dragIndex;

      if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
        // 交换关键帧位置
        const temp = this.keyframes[sourceIndex];
        this.keyframes.splice(sourceIndex, 1);
        this.keyframes.splice(targetIndex, 0, temp);

        // 更新选中状态
        if (this.selectedKeyframeIndex === sourceIndex) {
          this.selectedKeyframeIndex = targetIndex;
        } else if (this.selectedKeyframeIndex > sourceIndex && this.selectedKeyframeIndex <= targetIndex) {
          this.selectedKeyframeIndex--;
        } else if (this.selectedKeyframeIndex < sourceIndex && this.selectedKeyframeIndex >= targetIndex) {
          this.selectedKeyframeIndex++;
        }

        // 更新轨迹
        this.updateTrajectory();
        showToast({ type: 'success', message: '已调整关键帧顺序' });
      }

      this.dragIndex = -1;
      this.dragOverIndex = -1;
    },

    // 播放/暂停
    toggleLoopPlay() {
      if (this.keyframes.length < 2) {
        showToast({ type: 'warning', message: '请至少添加2个关键帧' });
        return;
      }

      if (this.isLoopPlaying) {
        this.stopPlayback();
      } else {
        this.startPlayback();
      }
    },

    // 切换预览模式
    async togglePreviewMode() {
      if (this.keyframes.length < 2) {
        showToast({ type: 'warning', message: '请至少添加2个关键帧' });
        return;
      }

      this.isPreviewMode = !this.isPreviewMode;

      if (this.isPreviewMode) {
        // 停止主播放
        this.stopPlayback();
        // 隐藏 annotation
        this.hideAnnotations();
        // 创建预览标记（异步）
        await this.createPreviewMarkers();
        // 开始预览动画
        this.startPreviewAnimation();
      } else {
        // 停止预览动画
        this.stopPreviewAnimation();
        // 移除预览标记
        this.removePreviewMarkers();
        // 显示 annotation
        this.showAnnotations();
      }
    },

    // 创建预览标记（轨迹、相机模型）
    async createPreviewMarkers() {
      if (!this.app || this.keyframes.length < 2) return;

      const focus = this.getModelCenter();
      if (!focus) return;

      const startKf = this.keyframes[0];

      // 创建相机标记（使用camera.glb模型）
      try {
        this.previewCameraMarker = new pc.Entity('preview-camera');

        // 加载camera.glb模型
        const cameraAsset = await this.loadGLBAsset('/camera.glb');
        // console.log("cameraAsset", cameraAsset)
        if (cameraAsset) {
          this.previewCameraMarker.addComponent('render', {
            asset: cameraAsset.asset
          });
          // 设置模型大小
          this.previewCameraMarker.setLocalScale(0.5, 0.5, 0.5);
        } else {
          // 如果加载失败，使用球体作为后备
          this.previewCameraMarker.addComponent('render', { type: 'sphere' });
          const camMat = new pc.StandardMaterial();
          camMat.diffuse = new pc.Color(1, 0.8, 0);
          camMat.emissive = new pc.Color(0.6, 0.4, 0);
          camMat.update();
          this.previewCameraMarker.render.meshInstances[0].material = camMat;
          this.previewCameraMarker.setLocalScale(0.3, 0.3, 0.3);
        }

        this.previewCameraMarker.setPosition(startKf.position.x, startKf.position.y, startKf.position.z);
        this.app.root.addChild(this.previewCameraMarker);
      } catch (e) {
        console.error('加载camera.glb失败，使用球体:', e);
        // 使用球体作为后备
        this.previewCameraMarker = new pc.Entity('preview-camera');
        this.previewCameraMarker.addComponent('render', { type: 'sphere' });
        const camMat = new pc.StandardMaterial();
        camMat.diffuse = new pc.Color(1, 0.8, 0);
        camMat.emissive = new pc.Color(0.6, 0.4, 0);
        camMat.update();
        this.previewCameraMarker.render.meshInstances[0].material = camMat;
        this.previewCameraMarker.setLocalScale(0.3, 0.3, 0.3);
        this.previewCameraMarker.setPosition(startKf.position.x, startKf.position.y, startKf.position.z);
        this.app.root.addChild(this.previewCameraMarker);
      }

      // 创建轨迹线
      this.createPreviewTrajectory();
    },

    // 加载GLB模型资源
    loadGLBAsset(url) {
      return new Promise((resolve, reject) => {
        if (!this.app) {
          reject(new Error('App not initialized'));
          return;
        }

        // 创建资产
        const asset = new pc.Asset('camera-model', 'container', {
          url: url
        });

        // 监听加载完成
        asset.on('load', (loadedAsset, resources) => {
          resolve({
            asset: loadedAsset,
            resource: resources
          });
        });

        asset.on('error', (err) => {
          reject(err);
        });

        // 添加到资产管理系统并加载
        this.app.assets.add(asset);
        this.app.assets.load(asset);
      });
    },

    // 创建预览轨迹线
    createPreviewTrajectory() {
      if (!this.app || this.keyframes.length < 2) return;

      // 构建路径点（直接使用关键帧位置）
      const pathPoints = this.keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      // 闭环模式：添加起点到末尾形成闭环
      if (this.closedLoop && this.keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      // 构建每段时间数组
      const segmentCount = this.closedLoop ? this.keyframes.length : this.keyframes.length - 1;
      const durations = [];
      for (let i = 0; i < segmentCount; i++) {
        durations.push(this.keyframes[i]?.time || 3);
      }

      const easingFn = this.getEasingFunction(this.interpolationType);

      const positions = [];
      const colors = [];
      const numPoints = 200;
      const totalTime = durations.reduce((a, b) => a + b, 0);

      for (let i = 0; i < numPoints; i++) {
        const t = (i / (numPoints - 1)) * totalTime;
        const targetPos = applyTimedPathMotion(pathPoints, t, durations, easingFn);

        positions.push(targetPos.x, targetPos.y, targetPos.z);
        colors.push(t, 1 - t, 1, 1);
      }

      const vertexFormat = new pc.VertexFormat(this.app.graphicsDevice, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_FLOAT32 }
      ]);

      const numVertices = positions.length / 3;
      const vertexBuffer = new pc.VertexBuffer(this.app.graphicsDevice, vertexFormat, numVertices);
      const iterator = new pc.VertexIterator(vertexBuffer);

      for (let i = 0; i < numVertices; i++) {
        iterator.element[pc.SEMANTIC_POSITION].set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        iterator.element[pc.SEMANTIC_COLOR].set(colors[i * 4], colors[i * 4 + 1], colors[i * 4 + 2], colors[i * 4 + 3]);
        iterator.next();
      }
      iterator.end();

      const mesh = new pc.Mesh(this.app.graphicsDevice);
      mesh.vertexBuffer = vertexBuffer;
      mesh.primitive[0].type = pc.PRIMITIVE_LINES;
      mesh.primitive[0].base = 0;
      mesh.primitive[0].count = numVertices;
      mesh.primitive[0].indexed = false;

      const material = new pc.StandardMaterial();
      material.emissive = new pc.Color(0, 0.8, 1);
      material.emissiveVertexColor = true;
      material.useLighting = false;
      material.update();

      const meshInstance = new pc.MeshInstance(mesh, material);

      this.previewTrajectoryEntity = new pc.Entity('preview-trajectory');
      this.previewTrajectoryEntity.addComponent('render', {
        meshInstances: [meshInstance]
      });
      this.app.root.addChild(this.previewTrajectoryEntity);
    },

    // 开始预览动画
    startPreviewAnimation() {
      this.previewProgress = 0;
      this.previewAnimationFrame = requestAnimationFrame(this.updatePreviewAnimation.bind(this));
    },

    // 更新预览动画
    updatePreviewAnimation() {
      if (!this.isPreviewMode || !this.previewCameraMarker || this.keyframes.length < 2 || this.totalDuration <= 0) return;

      // 使用dt来累加时间
      const dt = 1 / 60;
      this.previewProgress += dt;

      let currentTime = this.previewProgress;
      if (this.loopPlay) {
        currentTime = this.previewProgress % this.totalDuration;
        this.previewProgress = currentTime;
      } else if (currentTime >= this.totalDuration) {
        currentTime = this.totalDuration;
        this.previewProgress = this.totalDuration;
      }

      // 构建路径点（直接使用关键帧位置）
      const pathPoints = this.keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      // 闭环模式：添加起点到末尾形成闭环
      if (this.closedLoop && this.keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      // 构建每段时间数组
      const segmentCount = this.closedLoop ? this.keyframes.length : this.keyframes.length - 1;
      const durations = [];
      for (let i = 0; i < segmentCount; i++) {
        durations.push(this.keyframes[i]?.time || 3);
      }

      const easingFn = this.getEasingFunction(this.interpolationType);
      const targetPos = applyTimedPathMotion(pathPoints, currentTime, durations, easingFn);

      this.previewCameraMarker.setPosition(targetPos.x, targetPos.y, targetPos.z);

      if (this.isPreviewMode) {
        this.previewAnimationFrame = requestAnimationFrame(this.updatePreviewAnimation.bind(this));
      }
    },

    // 停止预览动画
    stopPreviewAnimation() {
      if (this.previewAnimationFrame) {
        cancelAnimationFrame(this.previewAnimationFrame);
        this.previewAnimationFrame = null;
      }
      this.previewProgress = 0;
    },

    // 移除预览标记
    removePreviewMarkers() {
      if (this.previewCameraMarker && this.app) {
        this.app.root.removeChild(this.previewCameraMarker);
        this.previewCameraMarker.destroy();
        this.previewCameraMarker = null;
      }
      if (this.previewTrajectoryEntity && this.app) {
        this.app.root.removeChild(this.previewTrajectoryEntity);
        this.previewTrajectoryEntity.destroy();
        this.previewTrajectoryEntity = null;
      }
    },

    // 获取缓动函数
    getEasingFunction(type) {
      switch (type) {
        case 'linear':
          return Easing.linear;
        case 'easeIn':
          return Easing.easeInQuad;
        case 'easeOut':
          return Easing.easeOutQuad;
        case 'easeInOut':
          return Easing.easeInOutQuad;
        default:
          return Easing.easeInOutQuad;
      }
    },

    // 隐藏所有 annotation
    hideAnnotations() {
      if (this.defaultAnnotationEntity) {
        this.defaultAnnotationEntity.enabled = false;
      }
      this.keyframeAnnotationEntities.forEach(entity => {
        if (entity) entity.enabled = false;
      });
    },

    // 显示所有 annotation
    showAnnotations() {
      if (this.defaultAnnotationEntity) {
        this.defaultAnnotationEntity.enabled = true;
      }
      this.keyframeAnnotationEntities.forEach(entity => {
        if (entity) entity.enabled = true;
      });
    },

    // 开始播放
    startPlayback() {
        // 如果进度为0且不是刚添加的关键帧，先跳到第一个关键帧位置
      // if (this.lastPlayProgress === 0 && this.keyframes.length > 0) {
      //   this.applyKeyframePosition(0);
      // }
      console.log("开始播放")
      this.isLoopPlaying = true;
      // 隐藏 annotation
      this.hideAnnotations();
      // 从上次暂停的位置继续播放
      this.playProgress = this.lastPlayProgress;

      // 禁用缩放（设置zoomRange最小值为0）
      if (this.cameraControls) {
        this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
        this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
      }
    },

    // 停止播放
    stopPlayback() {
      this.isLoopPlaying = false;
      // 显示 annotation
      this.showAnnotations();
      // 保存当前播放进度
      this.lastPlayProgress = this.playProgress;
      // 恢复原始zoomRange
      if (this.cameraControls && this.originalZoomRange) {
        this.cameraControls.zoomRange = new pc.Vec2(this.originalZoomRange.x, this.originalZoomRange.y);
        this.originalZoomRange = null;
      }
    },

    // 进度条拖动 - 使用节流优化性能
    handleOrbitProgressChange(value) {
      if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;
      if (!this.keyframes || this.keyframes.length < 2) return;

      // 拖动时禁用缩放
      if (!this._isDraggingSlider) {
        this._isDraggingSlider = true;
        if (this.cameraControls) {
          this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
          this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
        }
      }

      if (this.isLoopPlaying) {
        this.stopPlayback();
      }
      const clamped = this.clamp(Number(value) || 0, 0, this.totalDuration);
      this.playProgress = clamped;
      // 更新暂停位置，下次播放从新位置继续
      this.lastPlayProgress = clamped;

      // 节流：使用 requestAnimationFrame 限制更新频率
      if (!this._sliderThrottleId) {
        this._sliderThrottleId = requestAnimationFrame(() => {
          this._sliderThrottleId = null;
          this.applyPathAtTime(clamped);
        });
      }
    },

    // 进度条拖动结束
    handleOrbitProgressAfterChange() {
      // 恢复缩放
      if (this._isDraggingSlider) {
        this._isDraggingSlider = false;
        if (this.cameraControls && this.originalZoomRange) {
          this.cameraControls.zoomRange = new pc.Vec2(this.originalZoomRange.x, this.originalZoomRange.y);
          this.originalZoomRange = null;
        }
      }
      // 开始播放（会重新设置zoomRange为0）
      this.startPlayback();
    },

    // 根据时间应用运镜
    applyPathAtTime(currentTime) {
      if (this.keyframes.length < 2 || this.totalDuration <= 0) return;

      // 获取焦点
      const focus = this.getModelCenter();
      if (!focus) return;

      // 直接使用关键帧位置
      const pathPoints = this.keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      // 闭环模式：添加起点到末尾形成闭环
      if (this.closedLoop && this.keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      // 计算当前时间在哪个时间段
      let accumulatedTime = 0;
      let currentSegment = 0;
      let segmentT = 0;

      // 非闭环：最后一个关键帧的时间不算
      // 闭环：所有关键帧的时间都算
      const count = this.closedLoop ? this.keyframes.length : this.keyframes.length - 1;

      if (currentTime >= this.totalDuration) {
        currentSegment = count - 1;
        segmentT = 1;
      } else {
        for (let i = 0; i < count; i++) {
          const time = this.keyframes[i]?.time || 3;
          if (currentTime <= accumulatedTime + time) {
            currentSegment = i;
            segmentT = time > 0 ? (currentTime - accumulatedTime) / time : 0;
            break;
          }
          accumulatedTime += time;
        }
      }

      // 获取缓动函数并计算 easedT
      const easingFn = this.getEasingFunction(this.interpolationType);
      const easedT = easingFn(segmentT);

      // 获取当前段的首尾关键帧位置
      const startPos = pathPoints[currentSegment];
      const endPos = pathPoints[currentSegment + 1];

      if (!startPos || !endPos) return;

      // 线性插值计算目标位置
      const targetPos = new pc.Vec3();
      targetPos.lerp(startPos, endPos, easedT);

      this.cameraControls.reset(focus, targetPos, { immediate: true });
    },

    // 限制值范围
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    // 应用关键帧位置
    applyKeyframePosition(index) {
      if (!this.cameraControls || !this.keyframes[index]) return;
      const kf = this.keyframes[index];
      const kfPos = new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      const focus = this.getModelCenter();
      if (focus) {
        // 计算相对于焦点的偏移
        const offset = kfPos.clone().sub(focus);
        this.cameraControls.reset(focus, offset, { immediate: true });
      }
    },

    // 更新播放 - 使用时间驱动
    updatePlayback(dt) {
      if (!this.isLoopPlaying || this.keyframes.length < 2 || this.totalDuration <= 0) return;
      console.log(this.isLoopPlaying)
      // 时间累加
      this.playProgress += dt;

      let t = this.playProgress / this.totalDuration;

      if (this.loopPlay) {
        t = t % 1;
        this.playProgress = this.playProgress % this.totalDuration;
      } else if (t >= 1) {
        t = 1;
        this.playProgress = this.totalDuration;
        // 播放完成后重置，下次从头开始
        this.lastPlayProgress = 0;
        this.stopPlayback();
      }
      this.applyPathAtTime(this.playProgress);
    },

    // 重置相机
    resetCamera() {
      if (this.cameraControls && this.skullEntity) {
        if (this.initialCameraPose && (this.initialCameraPose.cameraPosition || this.initialCameraPose.position) && this.initialCameraPose.focus) {
          // 使用已保存的cameraPose
          const pos = this.initialCameraPose.cameraPosition || this.initialCameraPose.position;
          const focus = this.initialCameraPose.focus;
          const position = new pc.Vec3(pos.x, pos.y, pos.z);
          const focusVec = new pc.Vec3(focus.x, focus.y, focus.z);
          this.cameraControls.reset(focusVec, position, { duration: 0.5 });
        } else if (this.cameraData && this.cameraData[0]) {
          // 备用：从cameraData获取
          const vec = this.cameraDataToVector(this.cameraData);
          this.cameraControls.focusOnEntity(this.skullEntity, vec);
        }
      }
      this.updateCurrentCameraPos();
    },

    // 更新相机控制
    updateCameraControls() {
      if (!this.cameraControls) return;
      this.cameraControls.moveSpeed = this.viewerControls.moveSpeed;
      this.cameraControls.orbitSpeed = this.viewerControls.orbitSpeed;
      this.cameraControls.autoRotateSpeed = this.viewerControls.autoRotateSpeed;
      this.cameraControls.pinchSpeed = this.viewerControls.pinchSpeed;
      this.cameraControls.mode = this.viewerControls.isOrbitMode ? 'orbit' : 'fly';

      if (this.cameraEntity?.camera) {
        this.cameraEntity.camera.projection = pc.PROJECTION_PERSPECTIVE;
        this.cameraEntity.camera.fov = this.viewerControls.originalFov;
      }
    },

    // 画布调整大小
    handleCanvasResize() {
      if (!this.app || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (this.app.graphicsDevice.width !== width || this.app.graphicsDevice.height !== height) {
        this.app.graphicsDevice.setResolution(width, height);
        if (this.cameraEntity && this.cameraEntity.camera) {
          this.cameraEntity.camera.aspectRatio = width / height;
        }
      }
    },

    // 更新循环
    handleUpdate(dt) {
      // 更新相机位置显示
      this.updateCurrentCameraPos();

      // 更新播放
      this.updatePlayback(dt);

      // 更新相机控制器
      this.cameraControls?.update(dt, false, false, false);

      // 监听用户交互停止播放
      if (this.cameraControls?.hasUserInteracted) {
        this.cameraControls?.resetUserInteractionFlag?.();
        if(this.isLoopPlaying)
          this.stopPlayback();
      }
    },

    // 控件显示计时器
    showControlsTimer() {
      this.showControls = true;
      if (this.controlsHideTimer) {
        clearTimeout(this.controlsHideTimer);
      }
      this.controlsHideTimer = setTimeout(() => {
        this.showControls = false;
      }, 3000);
    },

    handleMouseMove() {
      this.showControlsTimer();
    },

    retryLoadModel() {
      this.loadModel();
    },

    // 销毁预览器
    destroyViewer() {
      if (this.controlsHideTimer) {
        clearTimeout(this.controlsHideTimer);
      }

      // 清除轨迹线
      this.clearTrajectory();

      // 停止并移除预览标记
      this.stopPreviewAnimation();
      this.removePreviewMarkers();

      // 销毁默认标注
      if (this.defaultAnnotationEntity && this.app) {
        if (this.defaultAnnotationEntity.parent) {
          this.defaultAnnotationEntity.parent.removeChild(this.defaultAnnotationEntity);
        }
        this.defaultAnnotationEntity.destroy();
        this.defaultAnnotationEntity = null;
      }

      if (this.skullEntity && this.app) {
        this.app.root.removeChild(this.skullEntity);
        this.skullEntity.destroy();
        this.skullEntity = null;
      }

      if (this.app) {
        this.app.destroy();
        this.app = null;
      }

      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }

      this.modelLoaded = false;
    },
  }
};
</script>

<style scoped>
.custom-motion-container {
  display: flex;
  width: 1200px;
  height: 80vh;
  background: #0f1218;
  overflow: hidden;
}

.preview-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 8px 0 0 8px;
}

/* 迷你预览区域 */
.mini-preview-panel {
  width: 100%;
  height: 180px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.mini-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.5);
}

.mini-preview-title {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
}

.mini-preview-controls {
  display: flex;
  gap: 4px;
}

.mini-preview-controls .ant-btn {
  padding: 2px 6px;
  height: 20px;
  color: #fff !important;
}

.mini-canvas {
  width: 100%;
  height: calc(100% - 28px);
  display: block;
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#custom-motion-canvas {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  pointer-events: auto;
}

/* 加载样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(18, 18, 18, 0.9);
  z-index: 10;
  gap: 20px;
}

.loading-spinner {
  color: #ffffff;
  font-size: 45px;
  text-indent: -9999em;
  overflow: hidden;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  position: relative;
  transform: translateZ(0);
  animation: mltShdSpin 1.7s infinite ease, round 1.7s infinite ease;
}

@keyframes mltShdSpin {
  0% {
    box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
  5%, 95% {
    box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
  10%, 59% {
    box-shadow: 0 -0.83em 0 -0.4em, -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em;
  }
  20% {
    box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em, -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, -0.749em -0.34em 0 -0.477em;
  }
  38% {
    box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em, -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, -0.82em -0.09em 0 -0.477em;
  }
  100% {
    box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
}

@keyframes round {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
}

.retry-btn {
  padding: 8px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 底部控制栏 */
.bottom-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bottom-controls.visible {
  opacity: 1;
}

.progress-section {
  margin-bottom: 12px;
}

.progress-time {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 8px;
  font-size: 12px;
}

.progress-time .current-time {
  color: #1890ff;
  font-weight: 600;
}

.progress-time .total-time {
  color: rgba(255, 255, 255, 0.6);
}

.progress-section .ant-slider {
  margin: 0;
}

.progress-section :deep(.ant-slider-rail) {
  background-color: rgba(255, 255, 255, 0.3);
}

.progress-section :deep(.ant-slider-track) {
  background-color: #1890ff;
}

.progress-section :deep(.ant-slider-handle)::after {
  box-shadow: 0 0 0 2px #1890ff;
}

.control-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.control-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  transition: all 0.2s ease;
  font-size: 12px;
}

.control-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.control-icon-btn .anticon {
  font-size: 14px;
}

/* 模式提示 */
.mode-tip {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mode-tip.fly-mode {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
}

/* 配置面板 */
.config-panel {
  width: 320px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #f0f0f0;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.config-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 10px;
}

.camera-position-display {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 10px;
}

.position-item {
  flex: 1;
  text-align: center;
}

.position-label {
  display: block;
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 2px;
}

.position-value {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.snapshot-btn {
  height: 36px;
  border-radius: 6px;
  font-size: 13px;
}

.keyframes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.keyframes-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.keyframes-item:hover {
  background: #f0f0f0;
}

.keyframes-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.keyframes-item.dragging {
  opacity: 0.5;
  background: #e6f7ff;
}

.keyframes-item.drag-over {
  border-top: 2px solid #1890ff;
}

.keyframes-item.closed-loop-end {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-left: 3px solid #52c41a;
}

.keyframes-item.closed-loop-end .keyframes-index {
  background: #52c41a;
}

.keyframes-loop-label {
  font-size: 10px;
  color: #52c41a;
  font-weight: 600;
  margin-top: 2px;
}

.keyframes-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.keyframes-info {
  flex: 1;
  min-width: 0;
}

.keyframes-position {
  font-size: 11px;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.keyframes-duration {
  font-size: 10px;
  color: #8c8c8c;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.keyframes-duration .duration-label {
  flex-shrink: 0;
}

.keyframes-duration .duration-unit {
  font-size: 10px;
  color: #8c8c8c;
}

.total-duration {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

.keyframes-actions {
  display: flex;
  gap: 2px;
}

.keyframes-empty {
  text-align: center;
  padding: 16px;
  color: #8c8c8c;
  font-size: 13px;
}

.empty-hint {
  font-size: 11px;
  margin-top: 6px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-row:last-child {
  border-bottom: none;
}

.preview-btn-wrapper {
  margin-top: 12px;
}

.preview-btn-wrapper .ant-btn {
  height: 36px;
  font-size: 13px;
}

.setting-label {
  font-size: 13px;
  color: #1d1d1f;
}

.setting-value {
  font-size: 12px;
  color: #666;
  min-width: 24px;
  text-align: right;
}

.config-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.config-footer .ant-btn {
  flex: 1;
  height: 34px;
  border-radius: 6px;
  font-size: 13px;
}

/* 手势说明 */
.gesture-modal .ant-modal-content {
  border-radius: 12px;
}

.gesture-content {
  padding: 8px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.gesture-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e8e8e8;
}

.gesture-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.gesture-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 6px;
  border-left: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gesture-section-title :deep(.anticon) {
  font-size: 16px;
  color: #1890ff;
}

.gesture-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.gesture-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.gesture-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.gesture-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  border-radius: 6px;
  color: #1890ff;
  font-size: 14px;
  flex-shrink: 0;
}

.gesture-key {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1d1d1f;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.gesture-text {
  flex: 1;
  min-width: 0;
}

.gesture-action {
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 1px;
}

.gesture-detail {
  font-size: 11px;
  color: #8c8c8c;
}
</style>

<style>
.custom-motion-modal .ant-modal-content {
  padding: 0;
  overflow: hidden;
}

.custom-motion-modal .ant-modal-body {
  padding: 0;
}
</style>
