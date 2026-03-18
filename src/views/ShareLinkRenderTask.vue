<template>
  <div
    class="render-task-container"
    ref="renderTaskContainerRef"
    @mousemove="handleMouseMove"
  >
    <div class="core-content">
      <div
        ref="viewerContainer"
        class="viewer-container fullscreen"
        :style="{ backgroundColor: viewerControls.backgroundColor }"
      >
        <canvas id="application-canvas" ref="canvasRef" @keydown="handleEscKey" tabindex="0"></canvas>

        <div v-if="isViewerLoading" class="loading-overlay">
          <div class="loading-spinner" :class="{ 'success': loading_status === 'success', 'fail': loading_status === 'fail' }"></div>
          <p class="loading-text">
            <template v-if="loading_status === ''">加载中...{{ loading_progress}}%</template>
            <template v-else-if="loading_status === 'success'">加载成功！</template>
            <template v-else-if="loading_status === 'fail'">加载失败，请重试</template>
          </p>
          <button v-if="loading_status === 'fail'" class="retry-btn" @click="retryLoadModel">重试加载</button>
        </div>
      </div>
    </div>

    <!-- 访问MetaST链接 -->
    <div class="home-link-area" @click.stop="$router.push('/')">
      <HomeOutlined class="home-icon" />
      <span class="home-text">访问MetaST</span>
    </div>

    <!-- 标注标题切换 -->
    <div v-if="showContorlWidget && annotataions.length > 0 && shouldShowAnnotation" class="annotation-cycling">
      <a-button type="text" class="annotation-nav-btn" @click.stop="prevAnnotation">
        <LeftOutlined />
      </a-button>
      <span class="annotation-current-title">{{ getCurrentAnnotationTitle() }}</span>
      <a-button type="text" class="annotation-nav-btn" @click.stop="nextAnnotation">
        <RightOutlined />
      </a-button>
    </div>

    <!-- 底部控制栏 -->
    <div
      class="bottom-controls"
      :class="{ visible: showControls }"
      @click.stop
    >
      <!-- 进度条 -->
      <div class="progress-section" v-if="showContorlWidget && rotation === 0">
        <a-slider
          v-model:value="orbitPlaybackAngle"
          :min="0"
          :max="isCustomMotionMode ? orbitTotalTime : 360"
          :step="0.1"
          :disabled="!skullEntity || !viewerControls.isOrbitMode"
          @change="handleOrbitProgressChange"
          @afterChange="isLoopPlaying = false"
          class="orbit-slider"
        />
        <span class="time-display">{{ formatTime(orbitCurrentTime) }} / {{ formatTime(orbitTotalTime) }}</span>
      </div>

      <!-- 功能按钮 -->
      <div class="control-buttons">
        <div class="btn-group left">
          <a-tooltip :title="isLoopPlaying ? '暂停' : '播放'">
            <a-button type="text" class="control-icon-btn" @click.stop="toggleLoopPlay" :disabled="!skullEntity || !viewerControls.isOrbitMode">
              <template #icon>
                <PauseOutlined v-if="isLoopPlaying" />
                <CaretRightOutlined v-else />
              </template>
              {{ isLoopPlaying ? '暂停' : '播放' }}
            </a-button>
          </a-tooltip>
          <a-tooltip title="重置视角">
            <a-button type="text" class="control-icon-btn" @click.stop="resetCamera">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-tooltip>
          <a-tooltip title="操作说明">
            <a-button type="text" class="control-icon-btn" @click.stop="showGestureModal = true">
              <template #icon><QuestionCircleOutlined /></template>
              说明
            </a-button>
          </a-tooltip>
        </div>
        <div class="btn-group right">
          <a-tooltip title="复制代码">
            <a-button type="text" class="control-icon-btn" @click.stop="handleEmbedCodePlaceholder">
              <template #icon><CodeOutlined /></template>
              嵌入
            </a-button>
          </a-tooltip>
          <a-tooltip :title="viewerControls.isOrbitMode ? '切换轨道模式' : '切换飞行模式'">
            <a-button type="text" class="control-icon-btn" :class="{ active: !viewerControls.isOrbitMode }" @click.stop="toggleMeshCursor">
              <template #icon><AimOutlined /></template>
              {{ viewerControls.isOrbitMode ? '轨道' : '飞行' }}
            </a-button>
          </a-tooltip>
          <a-tooltip :title="showGrid ? '隐藏网格' : '显示网格'">
            <a-button type="text" class="control-icon-btn" @click.stop="toggleGrid">
              <template #icon>
                <BorderOuterOutlined v-if="showGrid" />
                <BorderOutlined v-else />
              </template>
              网格
            </a-button>
          </a-tooltip>
          <a-tooltip :title="isFullscreen ? '退出全屏' : '全屏'">
            <a-button type="text" class="control-icon-btn" @click.stop="toggleFullscreen">
              <template #icon>
                <FullscreenExitOutlined v-if="isFullscreen" />
                <FullscreenOutlined v-else />
              </template>
              {{ isFullscreen ? '退出' : '全屏' }}
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>

    <!-- 手势操作说明对话框 -->
    <a-modal
      v-model:open="showGestureModal"
      title="操作说明"
      :footer="null"
      :mask-closable="true"
      width="520px"
      class="gesture-modal"
    >
      <div class="gesture-content">
        <div class="gesture-section">
          <div class="gesture-section-title">轨道模式（默认）</div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon"><SwapOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">旋转视角</div>
                <div class="gesture-detail">左键拖拽</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon"><ZoomInOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">缩放</div>
                <div class="gesture-detail">鼠标滚轮</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon"><DragOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">平移</div>
                <div class="gesture-detail">右键拖拽</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon"><FullscreenExitOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">双击聚焦</div>
                <div class="gesture-detail">双击模型某处聚焦查看</div>
              </div>
            </div>
          </div>
        </div>
        <div class="gesture-section">
          <div class="gesture-section-title">飞行模式</div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-icon"><ArrowUpOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">前进/后退</div>
                <div class="gesture-detail">W / S 键</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon"><ArrowLeftOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">左右移动</div>
                <div class="gesture-detail">A / D 键</div>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon"><RedoOutlined /></div>
              <div class="gesture-text">
                <div class="gesture-action">调整视角方向</div>
                <div class="gesture-detail">鼠标左键拖拽</div>
              </div>
            </div>
          </div>
        </div>
        <div class="gesture-section">
          <div class="gesture-section-title">快捷键</div>
          <div class="gesture-list">
            <div class="gesture-item">
              <div class="gesture-key">Esc</div>
              <div class="gesture-text">
                <div class="gesture-action">退出当前模式</div>
                <div class="gesture-detail">关闭面板、取消编辑等</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <EmbedCodeDialog
      v-model:open="showEmbedCodeDialog"
      :task-id="task_id"
    />
  </div>
</template>

<script>
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';
import * as pc from 'playcanvas';
import CameraControls from '@/utils/controller';
import { Picker } from '@/utils/picker';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CodeOutlined,
  CaretRightOutlined,
  PauseOutlined,
  CloseOutlined,
  BorderOuterOutlined,
  BorderOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  ZoomInOutlined,
  DragOutlined,
  ArrowUpOutlined,
  ArrowLeftOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  AimOutlined,
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import { loadGsplat } from '@/utils/load';
import { Annotation, AnnotationManager } from '../../scripts/esm/annotations.mjs';
import { Grid } from '../../scripts/esm/grid.mjs';
import EmbedCodeDialog from '@/components/EmbedCodeDialog.vue';
import {
  applyOrbitMotion,
  applyEllipseOrbit,
  applySpiralMotion,
  applyDollyMotion,
  applySwingMotion,
  applyFigureEightMotion,
  applyTimedPathMotion,
  Easing
} from '@/utils/camera-motions';

const showToast = (input) => {
  const defaultDuration = 2

  if (typeof input === 'string') {
    message.info(input, defaultDuration)
    return
  }

  const content = input?.message || '操作提示'
  const duration = typeof input?.duration === 'number' ? input?.duration / 1000 : defaultDuration

  switch (input?.type) {
    case 'success':
      message.success(content, duration)
      break
    case 'error':
      message.error(content, duration)
      break
    case 'warning':
      message.warning(content, duration)
      break
    case 'info':
      message.info(content, duration)
      break
    default:
      message.open({ content, duration })
      break
  }
}

const token = localStorage.getItem('token')

const pickDepthGlsl = /* glsl */ `
vec4 packFloat(float depth) {
    uvec4 u = (uvec4(floatBitsToUint(depth)) >> uvec4(0u, 8u, 16u, 24u)) & 0xffu;
    return vec4(u) / 255.0;
}
vec4 getPickOutput() {
    return packFloat(gl_FragCoord.z);
}
`;

const DEFAULT_SETTINGS = {
  showInfo: false,
  isOrbitMode: true,
  moveSpeed: 2,
  orbitSpeed: 18,
  autoRotateSpeed: 30,
  pinchSpeed: 0.4,
  originalFov: 75,
  isOrthographicCamera: false,
  usingExternalCamera: false,
  backgroundColor: '#000000'
};

export default {
  components:{
    EmbedCodeDialog,
    ReloadOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    CodeOutlined,
    CaretRightOutlined,
    PauseOutlined,
    CloseOutlined,
    BorderOuterOutlined,
    BorderOutlined,
    QuestionCircleOutlined,
    SwapOutlined,
    ZoomInOutlined,
    DragOutlined,
    ArrowUpOutlined,
    ArrowLeftOutlined,
    RedoOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignBottomOutlined,
    AimOutlined,
    HomeOutlined,
    LeftOutlined,
    RightOutlined,
  },
  props: {
    taskId: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      shareId:"",
      task_id: this.taskId,
      token: token,
      task_name: '',
      fileName: '',
      loading: false,
      loading_progress: 0,
      loading_status: '',
      showContorlWidget: false,
      isFullscreen: false,
      viewerControls: { ...DEFAULT_SETTINGS },
      app: null,
      canvas: null,
      device: null,
      resizeObserver: null,
      isViewerLoading: false,
      cameraEntity: null,
      cameraControls: null,
      skullEntity: null,
      dpr: 2,
      lightEntity: null,
      rotation: 0,
      showEmbedCodeDialog: false,
      forceStartInteractionFlag: false,
      annotationsSnapshot: null,
      annotationsSnapshotSerialized: '',
      annotataions: [],
      shouldShowAnnotation: true,
      currentAnnotationIndex: 0,
      defaultAnnotationEntity: null,
      manager: null,
      index: 0,
      isLoopPlaying: false,
      orbitPlaybackAngle: 0,
      orbitPlaybackSessionStartAngle: 0,
      orbitPlaybackTravelled: 0,
      orbitPlaybackStartPos: null,
      orbitPlaybackFocus: null,
      orbitPlaybackVector: null,
      originalZoomRange: null, // 保存原始zoomRange
      _isDraggingSlider: false, // 是否正在拖动进度条
      orbitMotionType: 'dolly', // 运镜类型: orbit, ellipse, spiral, dolly, swing, figureEight, custom
      orbitMotionParams: {
        scaleX: 1.0,
        scaleZ: 0.7,
        heightFactor: 0.3,
        radiusFactor: 0.1,
        distanceFactor: 0.3,
        oscillationPeriod: 2,
        swingAmplitude: 30,
        swingCenter: 0,
      },
      customMotion: null, // 自定义运镜数据
      customMotionCameraPose: null, // 初始相机pose传递给CustomMotion
      loopPlay: true, // 是否循环播放
      loopPlayStartDelayMs: 350,
      loopPlayStartTimer: null,
      autoLoopPlayTimer: null,
      showControls: true,
      controlsHideTimer: null,
      mouseDownPos: { x: 0, y: 0 },
      showGrid: true,
      gridEntity: null,
      showGestureModal: false,
      hasClickAnnotation: false,
      cameraData: null, // 相机数据
      initialCameraPose: null, // 初始相机位姿
      settings:{},
    };
  },
  watch:{
    rotation(newVal){
      if(this.cameraControls)
      {
        this.cameraControls.rotation = newVal;
        if(newVal !== 0)
           this.cameraControls.mode = "fly";
        else
           this.cameraControls.mode = 'orbit';
      }
    }
  },
  computed: {
    // 计算自定义运镜的总时长
    customMotionTotalDuration() {
      if (!this.customMotion || !this.customMotion.keyframes || this.customMotion.keyframes.length < 2) {
        return 0;
      }
      const { keyframes, closedLoop } = this.customMotion;
      const count = closedLoop ? keyframes.length : keyframes.length - 1;
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += keyframes[i]?.time || 0;
      }
      return total;
    },
    // 是否使用自定义运镜
    isCustomMotionMode() {
      return this.orbitMotionType === 'custom' && this.customMotion;
    },
    // 总时间（秒）
    orbitTotalTime() {
      if (this.isCustomMotionMode) {
        return this.customMotionTotalDuration;
      }
      const speed = this.viewerControls.autoRotateSpeed || 30;
      return 360 / speed;
    },
    // 当前时间（秒）
    orbitCurrentTime() {
      if (this.isCustomMotionMode) {
        return this.orbitPlaybackAngle;
      }
      const speed = this.viewerControls.autoRotateSpeed || 30;
      return this.orbitPlaybackAngle / speed;
    }
  },
  methods: {
    // 格式化时间显示为 mm:ss
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 获取当前标注标题
    getCurrentAnnotationTitle() {
      const titles = this.annotataions.map(item => item?.script?.annotation?.title || '未命名').filter(Boolean)
      if (titles.length === 0) return ''
      return titles[this.currentAnnotationIndex] || ''
    },

    // 切换到上一个标注
    prevAnnotation() {
      const titles = this.annotataions.map(item => item?.script?.annotation?.title || '未命名').filter(Boolean)
      if (titles.length === 0) return
      this.currentAnnotationIndex = (this.currentAnnotationIndex - 1 + titles.length) % titles.length
      this.focusAnnotation(this.currentAnnotationIndex)
    },

    // 切换到下一个标注
    nextAnnotation() {
      const titles = this.annotataions.map(item => item?.script?.annotation?.title || '未命名').filter(Boolean)
      if (titles.length === 0) return
      this.currentAnnotationIndex = (this.currentAnnotationIndex + 1) % titles.length
      this.focusAnnotation(this.currentAnnotationIndex)
    },

    // 聚焦指定标注
    focusAnnotation(index) {
      const annotations = this.annotataions
      if (!annotations || annotations.length === 0) return
      const annotation = annotations[index]
      if (!annotation || !annotation.script || !annotation.script.annotation) return
      this.manager._annotationResources.get(annotation.script.annotation).hotspotDom.dispatchEvent(new PointerEvent('pointerdown'))
    },

    getModelCenter() {
      if (!this.skullEntity) return null;
      const gsplatAabb = this.skullEntity.gsplat?.instance?.meshInstance?.aabb;
      if (gsplatAabb?.center) {
        return gsplatAabb.center.clone();
      }

      const renderComponents = this.skullEntity.findComponents?.('render') || [];
      const modelComponents = this.skullEntity.findComponents?.('model') || [];
      const meshInstances = [];

      renderComponents.forEach(render => meshInstances.push(...(render.meshInstances || [])));
      modelComponents.forEach(model => meshInstances.push(...(model.meshInstances || [])));

      if (!meshInstances.length) return null;

      const aabb = new pc.BoundingBox();
      aabb.copy(meshInstances[0].aabb);
      meshInstances.slice(1).forEach(mi => aabb.add(mi.aabb));
      return aabb.center.clone();
    },
    resetCamera(){
      this.forceStartInteractionFlag = true;
      if (this.isLoopPlaying || this.loopPlayStartTimer) {
        this.stopLoopPlayback(false);
      }
      if(this.skullEntity)
      {
        if(this.initialCameraPose?.cameraPosition && this.initialCameraPose?.focus)
        {
          const position = this.initialCameraPose?.cameraPosition
          const focus = this.initialCameraPose?.focus
          const vec = new pc.Vec3(position.x, position.y, position.z).clone().sub(
                new pc.Vec3(focus.x, focus.y ,focus.z)) ;
          this.cameraControls?.focusOnEntity(this.skullEntity, vec);
        }else{
          this.cameraControls.focusOnEntity(this.skullEntity);
        }
      }
      this.showControlsTimer();
    },
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
    handleContainerClick(event) {
      // 如果点击的是按钮或控件区域，不触发播放/暂停
      if (event.target.closest('.bottom-controls') || event.target.closest('.control-icon-btn')) {
        return;
      }
      // 切换播放状态
      if (this.showContorlWidget && this.skullEntity && this.viewerControls.isOrbitMode) {
        console.log("切换播放状态")
        this.toggleLoopPlay();
        this.showControlsTimer();
      }
    },
    initLoopPlaybackState(cameraPose = null) {
      if (!this.cameraEntity || !this.cameraControls || !this.skullEntity) return false;
      if (this.orbitPlaybackFocus && this.orbitPlaybackVector && this.orbitPlaybackStartPos) {
        return true;
      }
      let center, currentPos, vec;
      if(cameraPose) {
        center = cameraPose.focus;
        currentPos = cameraPose.cameraPosition;
        vec = currentPos.clone().sub(center);
        if (vec.length() < 1e-6) return false;
      }else{
        center = this.getModelCenter();
        if (!center) return false;

        currentPos = this.cameraEntity.getPosition().clone();
        vec = currentPos.clone().sub(center);
        if (vec.length() < 1e-6) return false;
      }

      this.orbitPlaybackFocus = center;
      this.orbitPlaybackStartPos = currentPos;
      this.orbitPlaybackVector = vec;
      return true;
    },
    applyOrbitAngle(angle, immediate = true) {
      if (!this.orbitPlaybackVector || !this.orbitPlaybackFocus || !this.cameraControls) return;

      const { orbitMotionType, orbitMotionParams } = this;
      let targetPos;

      const options = {
        focus: this.orbitPlaybackFocus,
        baseVector: this.orbitPlaybackVector,
        angle,
      };

      switch (orbitMotionType) {
        case 'ellipse':
          targetPos = applyEllipseOrbit({
            ...options,
            scaleX: orbitMotionParams.scaleX,
            scaleZ: orbitMotionParams.scaleZ,
          });
          break;
        case 'spiral':
          targetPos = applySpiralMotion({
            ...options,
            heightFactor: 0,
            radiusFactor: orbitMotionParams.radiusFactor,
          });
          break;
        case 'dolly':
          targetPos = applyDollyMotion({
            ...options,
            distanceFactor: orbitMotionParams.distanceFactor,
            oscillationPeriod: orbitMotionParams.oscillationPeriod,
          });
          break;
        case 'swing':
          targetPos = applySwingMotion({
            ...options,
            swingAmplitude: orbitMotionParams.swingAmplitude,
            swingCenter: orbitMotionParams.swingCenter,
          });
          break;
        case 'figureEight':
          targetPos = applyFigureEightMotion(
            this.orbitPlaybackFocus,
            this.orbitPlaybackVector,
            angle
          );
          break;
        case 'custom':
          // 自定义运镜不使用此方法
          return;
        case 'orbit':
        default:
          targetPos = applyOrbitMotion(options);
          break;
      }

      this.cameraControls.reset(this.orbitPlaybackFocus, targetPos, { immediate });
    },
    // 根据时间应用自定义运镜
    applyCustomMotionAtTime(currentTime, immediate = true) {
      if (!this.customMotion || !this.customMotion.keyframes || this.customMotion.keyframes.length < 2) return;
      if (!this.orbitPlaybackFocus || !this.cameraControls) return;

      const { keyframes, closedLoop, interpolationType } = this.customMotion;
      const totalDuration = this.customMotionTotalDuration;
      if (totalDuration <= 0) return;

      const pathPoints = keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      if (closedLoop && keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      const segmentCount = closedLoop ? keyframes.length : keyframes.length - 1;
      const durations = [];
      for (let i = 0; i < segmentCount; i++) {
        durations.push(keyframes[i]?.time || 3);
      }

      const easingMap = {
        'linear': Easing.linear,
        'easeIn': Easing.easeInCubic,
        'easeOut': Easing.easeOutCubic,
        'easeInOut': Easing.easeInOutCubic,
      };
      const easingFn = easingMap[interpolationType] || Easing.easeInOutCubic;

      const targetPos = applyTimedPathMotion(pathPoints, currentTime, durations, easingFn);

      this.cameraControls.reset(this.orbitPlaybackFocus, targetPos, { immediate: immediate });
    },
    clearLoopPlayStartTimer() {
      if (this.loopPlayStartTimer) {
        clearTimeout(this.loopPlayStartTimer);
        this.loopPlayStartTimer = null;
      }
    },
    clearAutoLoopPlayTimer() {
      if (this.autoLoopPlayTimer) {
        clearTimeout(this.autoLoopPlayTimer);
        this.autoLoopPlayTimer = null;
      }
    },
    stopLoopPlayback(restoreStart = false) {
      this.clearLoopPlayStartTimer();
      this.isLoopPlaying = false;
      this.orbitPlaybackTravelled = 0;
      // 恢复原始zoomRange
      if (this.cameraControls && this.originalZoomRange) {
        this.cameraControls.zoomRange = new pc.Vec2(this.originalZoomRange.x, this.originalZoomRange.y);
        this.originalZoomRange = null;
      }
      if (restoreStart && this.orbitPlaybackFocus && this.orbitPlaybackVector) {
        const returnAngle = this.clamp(this.orbitPlaybackSessionStartAngle || 0, 0, 360);
        this.orbitPlaybackAngle = returnAngle;
        this.applyOrbitAngle(returnAngle);
      }
    },
    toggleLoopPlay() {
      if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;
      if (this.isLoopPlaying) {
        this.stopLoopPlayback(false);
        this.showControlsTimer();
        return;
      }

      const inited = this.initLoopPlaybackState();
      if (!inited) {
        showToast({ type: 'warning', message: '当前相机位置无法开始旋转' });
        return;
      }

      this.showControlsTimer();

      // 自定义运镜模式
      if (this.isCustomMotionMode) {
        if (!this.orbitPlaybackFocus) {
          const inited = this.initLoopPlaybackState();
          if (!inited) {
            showToast({ type: 'warning', message: '当前相机位置无法开始运镜' });
            return;
          }
        }
        const shouldDelayStart = !!this.cameraControls?.hasUserInteracted || this.forceStartInteractionFlag;
        this.forceStartInteractionFlag = false;
        this.cameraControls?.resetUserInteractionFlag?.();
        if (!shouldDelayStart && !this.hasClickAnnotation) {
          this.applyCustomMotionAtTime(this.orbitPlaybackAngle, true);
          this.isLoopPlaying = true;
          return;
        }
        // 应用当前位置，使用非immediate模式实现平滑过渡
        this.applyCustomMotionAtTime(this.orbitPlaybackAngle, false);
        this.loopPlayStartTimer = setTimeout(() => {
          this.loopPlayStartTimer = null;
          if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;
          if (this.cameraControls) {
            this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
            this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
          }
          this.isLoopPlaying = true;
        }, this.loopPlayStartDelayMs);
        this.hasClickAnnotation = false;
        return;
      }

      const startAngle = this.clamp(this.orbitPlaybackAngle, 0, 360);
      this.orbitPlaybackSessionStartAngle = startAngle;
      this.orbitPlaybackTravelled = 0;
      this.clearLoopPlayStartTimer();
      const shouldDelayStart = !!this.cameraControls?.hasUserInteracted || this.forceStartInteractionFlag;
      this.forceStartInteractionFlag = false;
      this.cameraControls?.resetUserInteractionFlag?.();
      if (!shouldDelayStart && !this.hasClickAnnotation) {
        this.applyOrbitAngle(startAngle, true);
        this.isLoopPlaying = true;
        return;
      }

      this.applyOrbitAngle(startAngle, false);
      this.loopPlayStartTimer = setTimeout(() => {
        this.loopPlayStartTimer = null;
        if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;
        this.isLoopPlaying = true;
      }, this.loopPlayStartDelayMs);
      this.hasClickAnnotation = false;
    },
    handleOrbitProgressChange(value) {
      if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;

      // 拖动时禁用缩放
      if (!this._isDraggingSlider) {
        this._isDraggingSlider = true;
        if (this.cameraControls) {
          this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
          this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
        }
      }

      if (this.isLoopPlaying) {
        this.stopLoopPlayback(false);
      }

      // 自定义运镜模式
      if (this.isCustomMotionMode) {
        this.applyCustomMotionAtTime(Number(value) || 0);
        return;
      }

      if (!this.orbitPlaybackFocus || !this.orbitPlaybackVector || !this.orbitPlaybackStartPos) {
        const inited = this.initLoopPlaybackState();
        if (!inited) return;
      }

      const clamped = this.clamp(Number(value) || 0, 0, 360);
      this.orbitPlaybackAngle = clamped;
      this.orbitPlaybackTravelled = 0;
      this.orbitPlaybackSessionStartAngle = clamped;
      this.applyOrbitAngle(clamped);
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    normalizeOrbitAngle(angle) {
      const normalized = angle % 360;
      return normalized < 0 ? normalized + 360 : normalized;
    },
    clearAutoLoopPlayTimer() {
      if (this.autoLoopPlayTimer) {
        clearTimeout(this.autoLoopPlayTimer);
        this.autoLoopPlayTimer = null;
      }
    },
    handleEmbedCodePlaceholder($event) {
      this.showEmbedCodeDialog = true;
    },
    toggleGrid() {
      this.showGrid = !this.showGrid;
      if (this.gridEntity) {
        this.gridEntity.enabled = this.showGrid;
      }
    },
    toggleMeshCursor() {
      this.viewerControls.isOrbitMode = !this.viewerControls.isOrbitMode;
      this.cameraControls.mode = this.viewerControls.isOrbitMode ? 'orbit' : 'fly';
      if (!this.viewerControls.isOrbitMode) {
        this.stopLoopPlayback(false);
      }
    },
    updateCameraControlValue(key, value) {
      if (!this.cameraControls) return;
      switch (key) {
        case 'moveSpeed':
          this.cameraControls.moveSpeed = value;
          break;
        case 'orbitSpeed':
          this.cameraControls.orbitSpeed = value;
          break;
        case 'autoRotateSpeed':
          this.cameraControls.autoRotateSpeed = value;
          break;
        case 'pinchSpeed':
          this.cameraControls.pinchSpeed = value;
          break;
      }
    },
    syncFullscreenState() {
      this.isFullscreen = !!document.fullscreenElement;
    },
    async toggleFullscreen($event) {
      try {
        if (!document.fullscreenElement) {
          const target = this.$refs.renderTaskContainerRef || document.documentElement;
          if (target?.requestFullscreen) {
            await target.requestFullscreen();
          }
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error('全屏切换失败：', error);
        showToast({ type: 'warning', message: '全屏切换失败' });
      } finally {
        this.syncFullscreenState();
      }
    },
    async initViewer() {
      const container = this.$refs.viewerContainer;
      if (!container) return;
      this.canvas = document.getElementById('application-canvas');
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

        this.resizeObserver = new ResizeObserver(entries => {
          if (entries.length) {
            this.handleCanvasResize();
          }
        });

        if (this.$refs.viewerContainer) {
          this.resizeObserver.observe(this.$refs.viewerContainer);
        }

        this.resizeHandler = () => {
          this.handleCanvasResize();
        };
        window.addEventListener('resize', this.resizeHandler);

        this.cameraEntity = new pc.Entity('camera');
        this.cameraEntity.addComponent('camera', {
            fov: this.viewerControls.originalFov,
            frustumCulling: true,
            clearColor: new pc.Color(0, 0, 0, 0)
        });
        this.app.root.addChild(this.cameraEntity);
        this.cameraEntity.camera.requestSceneColorMap(true);

        this.cameraControls = new CameraControls(this.app, this.cameraEntity.camera, null);
        this.cameraControls.setModeChangeCallback((mode) => {
          this.viewerControls.isOrbitMode = (mode === 'orbit');
        });
        this.updateCameraControls();

        this.lightEntity = new pc.Entity('light');
        this.lightEntity.addComponent('light', {
          type: 'directional',
          shadowBias: 0.2,
          shadowResolution: 2048
        });
        this.app.root.addChild(this.lightEntity);

        // 创建网格
        this.gridEntity = new pc.Entity('grid');
        this.gridEntity.addComponent('script');
        this.gridEntity.script.create(Grid, {
          properties: {
            resolution: 2,
          }
        });
        this.gridEntity.setLocalScale(1000, 1, 1000);
        this.app.root.addChild(this.gridEntity);

        const picker = new Picker(this.app, this.cameraEntity);

        this.canvas.addEventListener('mousedown', (event) => {
          this.mouseDownPos = { x: event.clientX, y: event.clientY };
        });

        this.app.start();
      } catch (error) {
        showToast({ type: 'error', message: `初始化渲染器失败：${error.message}` });
        console.error('PlayCanvas初始化失败：', error);
      }
    },
    handleCanvasResize() {
      if (!this.app || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      const bufferWidth = Math.floor(width);
      const bufferHeight = Math.floor(height);
      if (this.app.graphicsDevice.width !== bufferWidth || this.app.graphicsDevice.height !== bufferHeight) {
        this.app.graphicsDevice.setResolution(bufferWidth, bufferHeight);
        if (this.cameraEntity && this.cameraEntity.camera) {
          this.cameraEntity.camera.aspectRatio = width / height;
        }
      }
    },
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
      this.updateBackgroundColor();
    },
    updateBackgroundColor() {
      if (!this.cameraEntity?.camera) return;
      const hex = (this.viewerControls.backgroundColor || '#000000').trim();
      const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
      if (normalized.length !== 6) return;
      const r = parseInt(normalized.slice(0, 2), 16) / 255;
      const g = parseInt(normalized.slice(2, 4), 16) / 255;
      const b = parseInt(normalized.slice(4, 6), 16) / 255;
      if ([r, g, b].some(value => Number.isNaN(value))) return;
      this.cameraEntity.camera.clearColor = new pc.Color(r, g, b, 1);
    },
    parseServerCameraPose(item) {
      const candidates = [
        item?.cameraPose,
        item?.camera_pose,
        item?.camera,
        item?.pose
      ];

      for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate === 'string') {
          try {
            const parsed = JSON.parse(candidate);
            const normalized = this.normalizeCameraPose(parsed);
            if (normalized) return normalized;
          } catch (e) {
            continue;
          }
        } else {
          const normalized = this.normalizeCameraPose(candidate);
          if (normalized) return normalized;
        }
      }

      return null;
    },
    normalizeCameraPose(pose) {
      const position = pose?.position;
      const focus = pose?.focus;
      const valid = [
        position?.x, position?.y, position?.z,
        focus?.x, focus?.y, focus?.z
      ].every(value => Number.isFinite(Number(value)));
      if (!valid) return null;

      return {
        position: {
          x: Number(position.x),
          y: Number(position.y),
          z: Number(position.z)
        },
        focus: {
          x: Number(focus.x),
          y: Number(focus.y),
          z: Number(focus.z)
        }
      };
    },
    retryLoadModel() {
      this.getTargetModel();
    },
    async loadSettings() {
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: `${API.GET_MODEL_SETTING}/${this.task_id}`
        }, this.token);
        const settings = response.data.data;
        console.log("settings", settings);
        if (settings) {
          this.settings = settings
          // 使用服务器返回的设置，如果某个字段不存在则使用默认值
          this.viewerControls.moveSpeed = settings.moveSpeed ?? DEFAULT_SETTINGS.moveSpeed;
          this.viewerControls.orbitSpeed = settings.orbitSpeed ?? DEFAULT_SETTINGS.orbitSpeed;
          this.viewerControls.autoRotateSpeed = settings.autoRotateSpeed ?? DEFAULT_SETTINGS.autoRotateSpeed;
          this.viewerControls.pinchSpeed = settings.pinchSpeed ?? DEFAULT_SETTINGS.pinchSpeed;
          this.viewerControls.backgroundColor = settings.backgroundColor ?? DEFAULT_SETTINGS.backgroundColor;
          if (settings.orbitMotionType !== undefined) {
            this.orbitMotionType = settings.orbitMotionType;
          }
          if (settings.motionData) {
            this.customMotion = settings.motionData;
            this.loopPlay = this.customMotion?.loopPlay !== false;
          }
          if (settings.initialCameraPose !== undefined) {
            this.initialCameraPose = settings.initialCameraPose;
          }
          this.updateCameraControls();
        }
      } catch (error) {
        console.log('获取设置失败或无设置，使用默认设置：', error);
      }
    },
    async getTargetModel() {
      const fullUrlString = `${API.BASE_URL}${API.TASK_DETAIL}/${this.task_id}/download-token`;
      const downloadTokenUrl = new URL(fullUrlString);
      downloadTokenUrl.searchParams.append('shareId', this.shareId);
      try {
        const response = await ApiServer.request({
          method: 'post',
          url: downloadTokenUrl.toString(),
        }, this.token);
        const download_token = response.data.token;

        this.isViewerLoading = true;
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
        }, this.token);

        const data = response1.data;
        const fileName = `${this.task_name || 'model'}.sog`;
        await this.renderFromArrayBuffer(fileName, data);
      } catch (error) {
        this.isViewerLoading = false;
        this.loading_status = 'fail';
        console.log(error);
      }
    },
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
        this.loading_status = 'fail';
        console.log(`解析模型失败：${error.message}`);
      }
    },
    async loadSplatAsset(fileName, fileUrl) {
      if (!this.app) {
        this.isViewerLoading = false;
        return;
      }

      let splatAsset = await loadGsplat(this.app.assets, {
        filename: fileName,
        url: fileUrl,
      });

      this.showContorlWidget = true;
      this.showControlsTimer();
      this.skullEntity = new pc.Entity('custom-splat');
      this.skullEntity.addComponent('gsplat', { asset: splatAsset});

      // Fetch annotations from server
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: API.GET_ANNOTATIONS,
          params: {
            taskId: this.task_id
          }
        });
        const annotationsData = response.data.data;
        console.log('Fetched annotations:', annotationsData);
        this.app.root.addChild(this.skullEntity);

        if (this.skullEntity) {
          let center, cameraPose;
          if(this.initialCameraPose?.cameraPosition && this.initialCameraPose?.focus)
          {
            const position = this.initialCameraPose?.cameraPosition
            const focus = this.initialCameraPose?.focus
            const vec = new pc.Vec3(position.x, position.y, position.z).clone().sub(
                  new pc.Vec3(focus.x, focus.y ,focus.z)) ;
            cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, vec);
            center = cameraPose?.focus;
          }
          else
          {
            await this.getCameraData();
            const vec = this.cameraDataToVector(this.cameraData)
            cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, vec);
            this.initialCameraPose = cameraPose
          }
          // 保存cameraPose用于传递给CustomMotion
          this.customMotionCameraPose = cameraPose;
          this.initLoopPlaybackState(cameraPose);
          this.cameraControls?.resetUserInteractionFlag?.();

          // Set up annotation manager
          this.skullEntity.addComponent('script');
          this.manager = this.skullEntity.script.create(AnnotationManager);

          // Create default annotation at center
          const annotation = new pc.Entity('annotation_default');
          annotation.setLocalPosition(center);
          this.defaultAnnotationEntity = annotation;
          annotation.addComponent('script');
          annotation.script.create(Annotation, {
            properties: {
              label: String(0),
              title: '3D Model',
              text: 'Auto-generated model',
              size: 0.01,
            }
          });
          this.app.root.addChild(annotation);

          // Load annotations from server
          if (annotationsData && annotationsData.length > 0) {
            annotationsData.forEach((item, index) => {
              const annotationEntity = new pc.Entity(`annotation_${item.label}`);
              annotationEntity.setLocalPosition(parseFloat(item.x), parseFloat(item.y), parseFloat(item.z));
              annotationEntity.__fromServer = true;
              annotationEntity.addComponent('script');
              const cameraPose = this.parseServerCameraPose(item);
              annotationEntity.script.create(Annotation, {
                properties: {
                  label: String(index + 1),
                  title: item.label,
                  text: item.description,
                  size: 1,
                  cameraPose
                }
              });
              this.app.root.addChild(annotationEntity);
              this.annotataions.push(annotationEntity);
            });
          }

          // Set up annotation event handlers
          this.app.on('annotation:click', this.onAnnotationClick);
          this.app.on('annotation:remove', this.onAnnotationRemove);
        }
      } catch (error) {
        console.log('Failed to load annotations:', error);
        this.app.root.addChild(this.skullEntity);
        if (this.skullEntity) {
          this.cameraControls?.focusOnEntity(this.skullEntity);
          this.cameraControls?.resetUserInteractionFlag?.();
        }
      }

      this.app.on('update', this.handleUpdate);
      URL.revokeObjectURL(fileUrl);
      this.loading_status = 'success';
      this.isViewerLoading = false;

      // 更新网格位置
      if (this.gridEntity && this.skullEntity && this.cameraControls) {
        const aabb = this.cameraControls.calculateEntityAabb(this.skullEntity);
        if (aabb) {
          const bottomPose = aabb.center.clone().sub(new pc.Vec3(0, aabb.halfExtents.y, 0));
          this.gridEntity.setPosition(bottomPose);
        }
      }

      // Auto-play on start
      this.$nextTick(() => {
        this.scheduleAutoLoopPlay(500);
      });
    },
    onAnnotationClick(annotationScript) {
      const entity = annotationScript?.entity;
      if (!entity) return;
      // 更新当前标注索引
      const index = this.annotataions.findIndex(item => 
        item.script.annotation.label === annotationScript.label)
      if (index >= 0) {
        this.currentAnnotationIndex = index
      }
      this.stopLoopPlayback(false);
      this.hasClickAnnotation = true;
      this.viewerControls.isOrbitMode = true;
      this.applyAnnotationCameraPose(annotationScript);
    },
    onAnnotationRemove(annotationScript) {
      console.log('onAnnotationRemove', annotationScript);
    },
    applyAnnotationCameraPose(annotationScript) {
      if (!annotationScript || !this.cameraControls) return false;
      const cameraPose = this.normalizeCameraPose(annotationScript.cameraPose);
      if (!cameraPose) return false;

      const focus = new pc.Vec3(cameraPose.focus.x, cameraPose.focus.y, cameraPose.focus.z);
      const position = new pc.Vec3(cameraPose.position.x, cameraPose.position.y, cameraPose.position.z);
      this.cameraControls.reset(focus, position, { duration: 0.5 });
      return true;
    },
    scheduleAutoLoopPlay(delayMs = 400) {
      if (this.autoLoopPlayTimer) {
        clearTimeout(this.autoLoopPlayTimer);
      }
      this.autoLoopPlayTimer = setTimeout(() => {
        this.autoLoopPlayTimer = null;
        if (this.skullEntity && this.viewerControls.isOrbitMode) {
          this.toggleLoopPlay();
        }
      }, delayMs);
    },
    handleUpdate(dt) {
      const shouldStopByUserInput = !!this.cameraControls?.hasUserInteracted;
      if (shouldStopByUserInput && (this.isLoopPlaying || this.loopPlayStartTimer)) {
        this.stopLoopPlayback(false);
        this.cameraControls?.resetUserInteractionFlag?.();
      }

      if (this.isLoopPlaying) {
        // 自定义运镜模式：使用时间驱动
        if (this.isCustomMotionMode) {
          const totalDuration = this.customMotionTotalDuration;
          if (totalDuration > 0) {
            this.orbitPlaybackAngle += dt;
            let t = this.orbitPlaybackAngle / totalDuration;

            if (this.loopPlay) {
              t = t % 1;
              this.orbitPlaybackAngle = this.orbitPlaybackAngle % totalDuration;
            } else if (t >= 1) {
              t = 1;
              this.orbitPlaybackAngle = totalDuration;
              this.stopLoopPlayback(false);
            }
            this.applyCustomMotionAtTime(this.orbitPlaybackAngle);
          }
        } else {
          // 其他运镜模式：使用角度驱动
          const speed = this.cameraControls?.autoRotateSpeed || 30;
          this.orbitPlaybackTravelled = (this.orbitPlaybackTravelled + speed * dt) % 360;
          const absoluteAngle = (this.orbitPlaybackSessionStartAngle || 0) + this.orbitPlaybackTravelled;
          this.orbitPlaybackAngle = this.normalizeOrbitAngle(absoluteAngle);
          this.applyOrbitAngle(this.orbitPlaybackAngle);
        }
      }

      this.cameraControls?.update(dt, false, false);
    },
    destroyPreViewer() {
      if (this.skullEntity && this.app) {
        this.app.root.removeChild(this.skullEntity);
        this.skullEntity.destroy();
        this.skullEntity = null;
      }
      if (this.gridEntity && this.app) {
        this.app.root.removeChild(this.gridEntity);
        this.gridEntity.destroy();
        this.gridEntity = null;
      }
      if (this.app) {
        this.app.destroy();
        this.app = null;
      }
      if (this.cameraControls) {
        this.cameraControls.clearSogProgressHandler?.();
      }
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    // 四元数旋转向量
    quatRotateVector(q) {
      const [qx, qy, qz, qw] = q;
      const [vx, vy, vz] = [0,0,-1];

      // 四元数旋转向量的数学公式
      const x = vx * (1 - 2*qy*qy - 2*qz*qz) + vy * (2*qx*qy - 2*qz*qw) + vz * (2*qx*qz + 2*qy*qw);
      const y = vx * (2*qx*qy + 2*qz*qw) + vy * (1 - 2*qx*qx - 2*qz*qz) + vz * (2*qy*qz - 2*qx*qw);
      const z = vx * (2*qx*qz - 2*qy*qw) + vy * (2*qy*qz + 2*qx*qw) + vz * (1 - 2*qx*qx - 2*qy*qy);

      return new pc.Vec3([x, y, z]);
    },
    // 将相机数据转换为向量
    cameraDataToVector(cameraData){
      if(cameraData?.length > 0)
        return this.quatRotateVector(cameraData[0]?.quaternion);
      else
        return null
    },
    // 获取相机数据
    async getCameraData(){
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: API.GET_CAMERA_DATA,
          params:{
            task_id: this.task_id
          }
        }, this.token);
        const cameraData = response.data.data;
        this.cameraData = cameraData;
        // console.log("【vue信息】相机数据：", cameraData);
      } catch (error) {
        console.error('获取相机数据失败：', error);
      }
    },
  },
  async mounted() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.addEventListener('fullscreenchange', this.syncFullscreenState);
    this.shareId = this.$route.query.shareId || '';
    await this.initViewer();
    await this.loadSettings();
    await this.getTargetModel();
    
    // 动态计算右侧面板偏移量
    this.$nextTick(() => {
        const offset = 30;
        document.documentElement.style.setProperty('--panel-right-offset', `${offset}px`);
    });
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.syncFullscreenState);
    if (this.app) {
      this.app.off('annotation:click', this.onAnnotationClick);
      this.app.off('annotation:remove', this.onAnnotationRemove);
    }
    this.clearAutoLoopPlayTimer();
    this.destroyPreViewer();
  }
};
</script>

<style scoped>
.render-task-container {
  --control-btn-size: 44px;
  --control-bar-gap: 8px;
  --panel-gap: 10px;
  height: 100vh;
  background: radial-gradient(circle at 50% 0%, #1b2130 0%, #0f1218 45%, #0b0e13 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.core-content{
  flex: 1;
  position: relative;
  overflow: hidden;
}

.viewer-container {
  width: 100%;
  height: 100%;
  cursor: grab;
  position: relative;
  overflow: hidden;
}

.viewer-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 99;
  overflow: hidden;
}

#application-canvas {
  width: 100vw !important;
  height: 100vh !important;
  object-fit: cover;
  pointer-events: auto;
  z-index: 998;
}

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
  background-color: rgba(18, 18, 18, 0.7);
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
  0% { box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em; }
  5%, 95% { box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em; }
  10%, 59% { box-shadow: 0 -0.83em 0 -0.4em, -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em; }
  20% { box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em, -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, -0.749em -0.34em 0 -0.477em; }
  38% { box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em, -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, -0.82em -0.09em 0 -0.477em; }
  100% { box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em; }
}

@keyframes round {
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
}

.loading-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.retry-btn {
  padding: 8px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bottom-control-bar {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 999;
}

.primary-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14);
}

.control-btn-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.primary-action-btn {
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.86);
  color: #1d1d1f;
  font-weight: 500;
  transition: all 0.22s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 92px;
}

.control-btn-item .ant-btn:hover {
  transform: translateY(-2px);
}

/* 底部控制栏 */
.bottom-controls {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 24px 20px;
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
  position: relative;
}

.time-display {
  position: absolute;
  top: -20px;
  right: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.orbit-slider {
  margin: 0;
}

.orbit-slider :deep(.ant-slider-rail) {
  background-color: rgba(255, 255, 255, 0.3);
}

.orbit-slider :deep(.ant-slider-track) {
  background-color: #1890ff;
}

.orbit-slider :deep(.ant-slider-handle)::after {
  box-shadow: 0 0 0 2px #1890ff;
}

.control-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 访问MetaST链接 */
.home-link-area {
  position: fixed;
  left: 24px;
  bottom: 100px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1001;
}

.home-link-area:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.home-link-area:active {
  transform: translateY(0);
}

.home-icon {
  font-size: 16px;
  color: #60a5fa;
}

.home-text {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-group.right {
  margin-left: auto;
  width: fit-content;
}

.control-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 6px;
  border-radius: 6px;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  transition: all 0.2s ease;
}

.control-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.control-icon-btn .anticon {
  font-size: 16px;
}

.control-icon-btn.active {
  background: rgba(24, 144, 255, 0.8);
}

.control-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-icon-btn:disabled:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 功能面板 */
.feature-panel {
  position: fixed;
  top: 60px;
  right: var(--panel-right-offset);
  width: 320px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1000;
  opacity: 0;
  transform: translateX(30px) scale(0.95);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.feature-panel.visible {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}

/* 右上角编辑面板 */
.feature-panel.top-right-panel {
  top: 70px;
  right: var(--panel-right-offset);
  left: auto;
  width: 340px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: panelSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Settings Panel */
.settings-panel {
  position: fixed;
  top: 70px;
  right: var(--panel-right-offset);
  width: 340px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1000;
  padding: 0;
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.settings-header span {
  font-weight: 700;
  color: #1d1d1f;
  font-size: 15px;
  letter-spacing: 0.3px;
}

.settings-content {
  padding: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: #f0f7ff;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
  white-space: nowrap;
}

.setting-slider-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 160px;
  margin-left: 12px;
}

.setting-slider-control .param-slider {
  flex: 1;
  margin: 0;
}

.setting-slider-control .param-slider :deep(.ant-slider-rail) {
  background-color: #f0f0f0;
}

.setting-slider-control .param-slider :deep(.ant-slider-track) {
  background: #1d1d1f;
}

.setting-slider-control .param-slider :deep(.ant-slider-handle)::after {
  width: 14px;
  height: 14px;
  background: #ffffff;
  border: 2px solid #1d1d1f;
  box-shadow: 0 0 8px rgba(29, 29, 31, 0.2);
}

.setting-value {
  font-size: 12px;
  color: #666;
  min-width: 28px;
  text-align: right;
}

.panel-footer {
  display: flex;
  justify-content: stretch;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafafa;
  border-radius: 0 0 16px 16px;
}

.panel-footer .ant-btn {
  flex: 1;
  height: 36px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-footer .ant-btn-primary {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

.panel-footer .ant-btn-primary:hover {
  background: linear-gradient(135deg, #4096ff 0%, #69b1ff 100%);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .bottom-controls {
    padding: 10px 12px 12px;
  }

  .control-icon-btn {
    width: 38px;
    height: 38px;
  }

  .control-icon-btn .anticon {
    font-size: 16px;
  }
}

/* 手势说明对话框样式 */
.gesture-modal .ant-modal-content {
  border-radius: 12px;
}

.gesture-content {
  padding: 8px 0;
}

.gesture-section {
  margin-bottom: 20px;
}

.gesture-section:last-child {
  margin-bottom: 0;
}

.gesture-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.gesture-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gesture-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 8px;
}

.gesture-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1677ff;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.gesture-key {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.gesture-text {
  flex: 1;
}

.gesture-action {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.gesture-detail {
  font-size: 12px;
  color: #8c8c8c;
}

/* 标注标题切换 */
.annotation-cycling {
  min-width: 280px;
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  z-index: 1001;
  animation: modeTipFadeIn 0.3s ease;
}

.annotation-current-title {
  font-size: 14px;
  color: #fff;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.annotation-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0 !important;
  color: rgba(255, 255, 255, 0.8) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.annotation-nav-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

@keyframes modeTipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>

<style>
html{
  overflow: hidden;
}
</style>
