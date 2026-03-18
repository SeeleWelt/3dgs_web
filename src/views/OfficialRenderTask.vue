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
        <!-- 视频录制/编码中遮罩提示 -->
        <div v-if="isRecordingVideo || isEncodingVideo" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p class="loading-text">
            <template v-if="isRecordingVideo">正在录制帧...{{ videoRecordProgress.toFixed(0) }}%</template>
            <template v-else-if="isEncodingVideo">正在生成MP4...{{ encodeProgress.toFixed(0) }}%</template>
          </p>
        </div>

        <!-- 快照边框效果 -->
        <div v-if="showSnapshotFlash" class="snapshot-border-overlay"></div>

        <!-- 标注操作菜单 -->
        <div
          v-if="showAnnotationMenu && isAnnotationEditMenuOpen"
          class="annotation-menu-popup"
          :style="{ left: `${annotationMenuPosition.x}px`, top: `${annotationMenuPosition.y}px` }"
          @click.stop
        >
          <div class="annotation-menu-items">
            <a-tooltip title="编辑">
              <a-button type="text" class="annotation-menu-btn" @click.stop="handleAnnotationEdit">
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="快照">
              <a-button type="text" class="annotation-menu-btn" @click.stop="handleAnnotationSnapshot">
                <template #icon><CameraOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除">
              <a-button type="text" class="annotation-menu-btn annotation-menu-delete" @click.stop="handleAnnotationDelete">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewerControls.showInfo && showContorlWidget" class="feature-panel top-right-panel" :class="{ visible: showControls }" @click.stop>
      <div class="panel-header">
        <span>特效选项</span>
        <a-button type="text" size="small" @click.stop="closeInfoPanel">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="effect-scroll-container">
        <div class="effect-grid">
          <button
            class="effect-card"
            type="button"
            v-for="effect in effectOptions"
            :key="`effect-top-${effect.id}`"
            @click="createEffect(effect.id)"
          >
            <img
              class="effect-card-thumb"
              :src="effect.src"
              :alt="effect.name"
              loading="lazy"
              decoding="async"
            />
            <div class="effect-card-title">{{ effect.name }}</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 设置面板 - 移到左上角 -->
    <div v-if="isSettingsMenuOpen && showContorlWidget" class="feature-panel settings-panel top-right-panel" :class="{ visible: showControls }" @click.stop>
      <div class="panel-header">
        <span>参数设置</span>
        <a-button type="text" size="small" @click.stop="closeSettingsPanel">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="settings-content">
        <!-- 运镜设置 -->
        <div class="setting-section-title">运镜设置</div>
        <div class="setting-item">
          <label class="setting-label">运镜类型</label>
          <a-select
            v-model:value="orbitMotionType"
            :disabled="!skullEntity || !viewerControls.isOrbitMode || isRecordingVideo || isEncodingVideo"
            style="width: 120px"
            size="small"
          >
            <a-select-option value="orbit">圆形轨道</a-select-option>
            <a-select-option value="ellipse">椭圆轨道</a-select-option>
            <a-select-option value="spiral">螺旋上升</a-select-option>
            <a-select-option value="dolly">推拉运镜</a-select-option>
            <a-select-option value="swing">摇摆运镜</a-select-option>
            <a-select-option value="figureEight">8字形</a-select-option>
            <a-select-option v-if="customMotion" value="custom">自定义运镜</a-select-option>
          </a-select>
        </div>
        <!-- <div class="setting-item">
          <a-button type="primary" block @click="openCustomMotion" :disabled="isRecordingVideo || isEncodingVideo" class="custom-motion-btn">
            <template #icon><VideoCameraOutlined /></template>
            自定义运镜
          </a-button>
        </div> -->

        <div class="setting-divider"></div>

        <!-- 视角设置 -->
        <div class="setting-section-title">视角设置</div>
        <div class="setting-item">
          <label class="setting-label">飞行速度</label>
          <div class="setting-slider-control">
            <a-slider v-model:value="viewerControls.moveSpeed" :min="0.1" :max="5" :step="0.1" :disabled="viewerControls.usingExternalCamera" @change="updateCameraControlValue('moveSpeed', viewerControls.moveSpeed)" class="param-slider" />
            <span class="setting-value">{{ viewerControls.moveSpeed.toFixed(1) }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">轨道速度</label>
          <div class="setting-slider-control">
            <a-slider v-model:value="viewerControls.orbitSpeed" :min="1" :max="30" :step="0.5" :disabled="viewerControls.usingExternalCamera" @change="updateCameraControlValue('orbitSpeed', viewerControls.orbitSpeed)" class="param-slider" />
            <span class="setting-value">{{ viewerControls.orbitSpeed.toFixed(1) }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">旋转速度</label>
          <div class="setting-slider-control">
            <a-slider v-model:value="viewerControls.autoRotateSpeed" :min="5" :max="90" :step="1" :disabled="viewerControls.usingExternalCamera" @change="updateCameraControlValue('autoRotateSpeed', viewerControls.autoRotateSpeed)" class="param-slider" />
            <span class="setting-value">{{ viewerControls.autoRotateSpeed.toFixed(0) }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">缩放灵敏度</label>
          <div class="setting-slider-control">
            <a-slider v-model:value="viewerControls.pinchSpeed" :min="0.1" :max="2" :step="0.1" :disabled="viewerControls.usingExternalCamera" @change="updateCameraControlValue('pinchSpeed', viewerControls.pinchSpeed)" class="param-slider" />
            <span class="setting-value">{{ viewerControls.pinchSpeed.toFixed(1) }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">背景颜色</label>
          <ColorPicker
            v-model:pureColor="viewerControls.backgroundColor"
            format="hex"
            @pure-color-change="updateBackgroundColor"
          />
        </div>
        <!-- <div class="setting-item" style="display: flex; flex-direction: column; gap: 5px">
          <a-button type="default" block @click="setInitialCameraPosition" :disabled="!skullEntity || !cameraControls" class="custom-motion-btn">
            <template #icon><CameraOutlined /></template>
            设置初始化位置
          </a-button>
          <div class="setting-item-tip">设置当前相机位置为初始化位置</div>
        </div> -->
      </div>
      <div class="panel-footer">
        <!-- <a-button type="primary" size="small" @click.stop="saveSettings">保存设置</a-button> -->
        <a-button size="small" @click.stop="resetAllSettings">重置参数</a-button>
      </div>
    </div>

    <!-- 模型编辑面板 - 移到左上角 -->
    <div v-if="isEditMenuOpen && showContorlWidget" class="feature-panel edit-panel top-right-panel" :class="{ visible: showControls }" @click.stop>
      <div class="panel-header">
        <span>模型编辑</span>
        <a-button type="text" size="small" @click.stop="closeEditModal">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="edit-modal-content">
        <div class="axis-panels">
          <div class="axis-panel">
            <div class="axis-panel-header">
              <span class="axis-panel-icon">↔</span>
              <span class="axis-panel-title">X 轴</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'x+' ? 'primary' : 'default'" @click.stop="selectAxis('x+')">X+</a-button>
              <a-slider :value="axisValues['x+']" :min="getAxisRange('x+').min" :max="getAxisRange('x+').max" :step="getAxisRange('x+').step" @change="handleAxisValueChange('x+', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['x+'] ?? 0).toFixed(2) }}</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'x-' ? 'primary' : 'default'" @click.stop="selectAxis('x-')">X-</a-button>
              <a-slider :value="axisValues['x-']" :min="getAxisRange('x-').min" :max="getAxisRange('x-').max" :step="getAxisRange('x-').step" @change="handleAxisValueChange('x-', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['x-'] ?? 0).toFixed(2) }}</span>
            </div>
          </div>

          <div class="axis-panel">
            <div class="axis-panel-header">
              <span class="axis-panel-icon">↕</span>
              <span class="axis-panel-title">Y 轴</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'y+' ? 'primary' : 'default'" @click.stop="selectAxis('y+')">Y+</a-button>
              <a-slider :value="axisValues['y+']" :min="getAxisRange('y+').min" :max="getAxisRange('y+').max" :step="getAxisRange('y+').step" @change="handleAxisValueChange('y+', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['y+'] ?? 0).toFixed(2) }}</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'y-' ? 'primary' : 'default'" @click.stop="selectAxis('y-')">Y-</a-button>
              <a-slider :value="axisValues['y-']" :min="getAxisRange('y-').min" :max="getAxisRange('y-').max" :step="getAxisRange('y-').step" @change="handleAxisValueChange('y-', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['y-'] ?? 0).toFixed(2) }}</span>
            </div>
          </div>

          <div class="axis-panel">
            <div class="axis-panel-header">
              <span class="axis-panel-icon">⟳</span>
              <span class="axis-panel-title">Z 轴</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'z+' ? 'primary' : 'default'" @click.stop="selectAxis('z+')">Z+</a-button>
              <a-slider :value="axisValues['z+']" :min="getAxisRange('z+').min" :max="getAxisRange('z+').max" :step="getAxisRange('z+').step" @change="handleAxisValueChange('z+', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['z+'] ?? 0).toFixed(2) }}</span>
            </div>
            <div class="axis-slider-row">
              <a-button class="axis-side-btn" size="small" :type="currentAxis === 'z-' ? 'primary' : 'default'" @click.stop="selectAxis('z-')">Z-</a-button>
              <a-slider :value="axisValues['z-']" :min="getAxisRange('z-').min" :max="getAxisRange('z-').max" :step="getAxisRange('z-').step" @change="handleAxisValueChange('z-', $event)" class="param-slider" />
              <span class="axis-row-value">{{ (axisValues['z-'] ?? 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="panel-footer">
        <a-button size="small" @click.stop="resetEntity">重置</a-button>
        <a-button type="primary" size="small" @click.stop="saveCropSettings">保存</a-button>
        <a-button type="primary" size="small" @click.stop="showCoverConfirmModal">保存并覆盖</a-button>
      </div>
    </div>

    <!-- 视频特效面板 - 移到左上角 -->
    <div v-if="showVideoEffectDialog && showContorlWidget" class="feature-panel video-panel top-right-panel" :class="{ visible: showControls }" @click.stop>
      <div class="panel-header">
        <span>生成旋转视频</span>
        <a-button type="text" size="small" @click.stop="closeVideoEffectDialog">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
      <div class="video-effect-selector">
        <div class="video-effect-grid">
          <div
            class="effect-option"
            :class="{ active: selectedVideoEffect === -1 }"
            @click="previewEffect(-1)"
          >
            <div class="effect-icon no-effect-icon">
              <CloseOutlined :style="{ fontSize: '20px' }" />
            </div>
            <div class="effect-name">无特效</div>
          </div>
          <div
            class="effect-option"
            v-for="effect in effectOptions"
            :key="`effect-video-${effect.id}`"
            :class="{ active: selectedVideoEffect === effect.id }"
            @click="previewEffect(effect.id)"
          >
            <div class="effect-icon">
              <img
                class="effect-icon-img"
                :src="effect.src"
                :alt="effect.name"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="effect-name">{{ effect.name }}</div>
          </div>
        </div>
        <p class="tips-text">提示：点击特效预览，生成过程中请勿关闭页面</p>
      </div>
      <div class="panel-footer">
        <a-button type="primary" size="small" @click.stop="confirmVideoGenerate">生成视频</a-button>
      </div>
    </div>

    <!-- 模式提示 -->
    <div v-if="showContorlWidget && (isAnnotationEditMenuOpen || !viewerControls.isOrbitMode || isEditMenuOpen)" class="mode-tip" :class="{ 'fly-mode': !viewerControls.isOrbitMode, 'annotation-mode': isAnnotationEditMenuOpen, 'edit-mode': isEditMenuOpen }">
      <template v-if="!viewerControls.isOrbitMode">
        <span class="mode-icon">✈️</span>
        <span>飞行模式</span>
      </template>
      <template v-else-if="isEditMenuOpen">
        <span class="mode-icon">📐</span>
        <span>模型编辑模式</span>
      </template>
      <template v-else-if="isAnnotationEditMenuOpen">
        <span class="mode-icon">📝</span>
        <span>标注编辑模式</span>
      </template>
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

    <!-- 右侧中间功能按钮组 - 垂直排列 -->
    <div
      class="right-center-controls"
      :class="{ visible: showControls }"
      v-if="showContorlWidget && rotation === 0"
      @click.stop
    >
      <a-tooltip title="特效选项" placement="left">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: viewerControls.showInfo }"
          @click.stop="toggleInfoPanel"
          :disabled="isRecordingVideo || isEncodingVideo"
        >
          <template #icon><AppstoreOutlined /></template>
          特效
        </a-button>
      </a-tooltip>
      <a-tooltip :title="viewerControls.isOrbitMode ? '切换轨道模式' : '切换飞行模式'" placement="left">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: !viewerControls.isOrbitMode }"
          @click.stop="toggleMeshCursor"
          :disabled="isRecordingVideo || isEncodingVideo"
        >
          <template #icon><AimOutlined /></template>
          {{ viewerControls.isOrbitMode ? '轨道' : '飞行' }}
        </a-button>
      </a-tooltip>
      <a-tooltip title="参数设置" placement="left">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: isSettingsMenuOpen }"
          @click.stop="toggleSettingsMenu"
          :disabled="isRecordingVideo || isEncodingVideo"
        >
          <template #icon><SettingOutlined /></template>
          设置
        </a-button>
      </a-tooltip>
      <a-tooltip title="模型编辑" placement="left" v-if="false">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: isEditMenuOpen }"
          @click.stop="openModelEditMenu"
          :disabled="isRecordingVideo || isEncodingVideo"
        >
          <template #icon><EditOutlined /></template>
          编辑
        </a-button>
      </a-tooltip>
      <a-tooltip :title="isAnnotationEditMenuOpen ? '退出标注' : '标注'" placement="left" v-if="false">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: isAnnotationEditMenuOpen }"
          @click.stop="openAnnotationEditMenu"
          :disabled="isRecordingVideo || isEncodingVideo"
        >
          <template #icon><MessageOutlined /></template>
          标注
        </a-button>
      </a-tooltip>
      <a-tooltip title="生成视频" placement="left">
        <a-button
          type="text"
          class="control-icon-btn"
          tabindex="-1"
          :class="{ active: showVideoEffectDialog }"
          @click.stop="openVideoEffectDialog"
          :disabled="isRecordingVideo || isEncodingVideo"

        >
          <template #icon><VideoCameraOutlined /></template>
          视频
        </a-button>
      </a-tooltip>
    </div>

    <!-- 底部控制栏 -->
    <div
      class="bottom-controls"
      :class="{ visible: showControls }"
      v-if="showContorlWidget && rotation === 0"
      @click.stop
    >
      <!-- 进度条 -->
      <div class="progress-section">
        <a-slider
          v-model:value="orbitPlaybackAngle"
          :min="0"
          :max="isCustomMotionMode ? orbitTotalTime : 360"
          :step="0.1"
          :disabled="!skullEntity || !viewerControls.isOrbitMode || isRecordingVideo || isEncodingVideo"
          @change="handleOrbitProgressChange"
          @afterChange="handleOrbitProgressAfterChange"
          class="orbit-slider"
        />
        <span class="time-display">{{ formatTime(orbitCurrentTime) }} / {{ formatTime(orbitTotalTime) }}</span>
      </div>

      <!-- 功能按钮 -->
      <div class="control-buttons">
        <!-- 左侧按钮组：播放/暂停、重置 -->
        <div class="btn-group left">
          <a-tooltip :title="isLoopPlaying ? '暂停' : '播放'">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="toggleLoopPlay" :disabled="!skullEntity || !viewerControls.isOrbitMode || isRecordingVideo || isEncodingVideo">
              <template #icon>
                <PauseOutlined v-if="isLoopPlaying" />
                <CaretRightOutlined v-else />
              </template>
              {{ isLoopPlaying ? '暂停' : '播放' }}
            </a-button>
          </a-tooltip>
          <a-tooltip title="重置视角">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="resetCamera" :disabled="!skullEntity || isRecordingVideo || isEncodingVideo">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-tooltip>
          <a-tooltip title="操作说明">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="showGestureModal = true" :disabled="isRecordingVideo || isEncodingVideo">
              <template #icon><QuestionCircleOutlined /></template>
              说明
            </a-button>
          </a-tooltip>
        </div>

        <!-- 右侧按钮组：分享、导出、嵌入、全屏 -->
        <div class="btn-group right">
          <a-tooltip title="分享"  v-if="false" >
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="handleSharePlaceholder" :disabled="isRecordingVideo || isEncodingVideo">
              <template #icon><ShareAltOutlined /></template>
              分享
            </a-button>
          </a-tooltip>
          <a-tooltip title="导出模型">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="handleExportPlaceholder" :disabled="isRecordingVideo || isEncodingVideo">
              <template #icon><ExportOutlined /></template>
              导出
            </a-button>
          </a-tooltip>
          <a-tooltip title="嵌入代码" v-if="false">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="handleEmbedCodePlaceholder" :disabled="isRecordingVideo || isEncodingVideo">
              <template #icon><CodeOutlined /></template>
              嵌入
            </a-button>
          </a-tooltip>
          <a-tooltip :title="showGrid ? '隐藏网格' : '显示网格'">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="toggleGrid" :disabled="isRecordingVideo || isEncodingVideo">
              <template #icon>
                <BorderOuterOutlined  v-if="showGrid" />
                <BorderOutlined v-else />
              </template>
              网格
            </a-button>
          </a-tooltip>
          <a-tooltip :title="isFullscreen ? '退出全屏' : '全屏'">
            <a-button type="text" class="control-icon-btn" tabindex="-1" @click.stop="toggleFullscreen" :disabled="isRecordingVideo || isEncodingVideo">
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
    
    

    <a-modal
      v-model:open="showConfirmModal"
      title="文件覆盖确认" 
      ok-text="确认"
      cancel-text="取消"
      @ok="confirmSaveChanges"
      @cancel="closeConfirmModal"
    >确认要覆盖原有的文件吗？<br/>此操作不可撤销。</a-modal>
    
    <a-modal
      v-model:open="showSuccessModal"
      title="操作成功"
      ok-text="确定"
      :cancel-button-props="{ style: { display: 'none' } }"
      @ok="closeSuccessModal"
    >
      <div class="success-content">
        <p class="success-text">文件已覆盖</p>
        <CheckCircleFilled class="success-icon" />
      </div>
    </a-modal>

    <ShareDialog
    v-if="false"
      v-model:open="showShareDialog"
      :task-id="task_id"
      :official="true"
    />

    <OfficialExportDialog
      v-model:open="showExportDialog"
      :task-id="task_id"
      :file-name="task_name || fileName"
    />

    <EmbedCodeDialog
    v-if="false"
      v-model:open="showEmbedCodeDialog"
      :task-id="task_id"
      :official="true"
    />

    <CustomMotion
      v-model:open="showCustomMotion"
      :task-id="task_id"
      :custom-motion="customMotion"
      :initial-camera-pos="customMotionCameraPose"
      :model-array-buffer="customMotionModelBuffer"
      @confirm="handleCustomMotionConfirm"
    />

    <a-modal
      v-model:open="showAnnotationExitConfirm"
      title="退出标注编辑"
    >
      <p>是否保存标注？</p>
      <template #footer>
        <div class="annotation-exit-footer">
          <a-tooltip title="取消退出">
            <a-button
              type="default"
              @click="cancelExitAnnotationEditMode"
            >
              取消
            </a-button>
          </a-tooltip>
          <a-tooltip title="不保存并退出">
            <a-button
              danger
              @click="confirmExitAnnotationEditMode(false)"
            >
              不保存
            </a-button>
          </a-tooltip>
          <a-tooltip title="保存并退出">
            <a-button
              type="primary"
              @click="confirmExitAnnotationEditMode(true)"
            >
              保存
            </a-button>
          </a-tooltip>
        </div>
      </template>
    </a-modal>

    <!-- 标注创建/编辑/查看对话框 -->
    <a-modal
      v-model:open="isAnnotationDialogOpen"
      class="annotation-dialog"
      :footer="null"
      :mask-closable="false"
    >
      <div class="annotation-dialog-inner">
        <div class="annotation-dialog-header">
          <h3 v-if="annotationDialogMode === 'create'">创建标注</h3>
          <h3 v-else-if="annotationDialogMode === 'edit'">编辑标注</h3>
          <h3 v-else>标注信息</h3>
        </div>

        <div class="annotation-dialog-body">
          <template v-if="annotationDialogMode === 'view'">
            <div class="annotation-view-item">
              <div class="label">标题</div>
              <div class="value">{{ annotationForm.title || '-' }}</div>
            </div>
            <div class="annotation-view-item">
              <div class="label">内容</div>
              <div class="value">{{ annotationForm.text || '-' }}</div>
            </div>
          </template>
          <template v-else>
            <a-input
              v-model:value="annotationForm.title"
              placeholder="请输入标题"
              allow-clear
            />
            <a-textarea
              v-model:value="annotationForm.text"
              :rows="4"
              placeholder="请输入内容"
              allow-clear
            />
          </template>
        </div>

        <div class="annotation-dialog-footer">
          <a-tooltip title="取消">
            <a-button
              type="default"
              @click="closeAnnotationDialog"
            >
              取消
            </a-button>
          </a-tooltip>
          <a-tooltip title="删除标注" v-if="annotationDialogMode === 'edit'">
            <a-button
              danger
              @click="deleteAnnotation"
            >
              删除
            </a-button>
          </a-tooltip>
          <a-tooltip title="保存标注" v-if="annotationDialogMode !== 'view'">
            <a-button
              type="primary"
              @click="confirmAnnotationDialog"
            >
              保存
            </a-button>
          </a-tooltip>
          <a-tooltip title="确定" v-else>
            <a-button
              type="primary"
              @click="closeAnnotationDialog"
            >
              确定
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </a-modal>

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
        <!-- 浏览器端操作说明 -->
        <template v-if="!isMobile">
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
                <div class="gesture-icon"><FullscreenExitOutlined   /></div>
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
        </template>
        <!-- 移动端操作说明 -->
        <template v-else>
          <div class="gesture-section">
            <div class="gesture-section-title">轨道模式（默认）</div>
            <div class="gesture-list">
              <div class="gesture-item">
                <div class="gesture-icon"><SwapOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">旋转视角</div>
                  <div class="gesture-detail">单指拖拽</div>
                </div>
              </div>
              <div class="gesture-item">
                <div class="gesture-icon"><ZoomInOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">缩放</div>
                  <div class="gesture-detail">双指捏合/张开</div>
                </div>
              </div>
              <div class="gesture-item">
                <div class="gesture-icon"><DragOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">平移</div>
                  <div class="gesture-detail">双指同步拖拽</div>
                </div>
              </div>
              <div class="gesture-item">
                <div class="gesture-icon"><FullscreenExitOutlined   /></div>
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
                <div class="gesture-icon"><MobileOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">虚拟摇杆飞行</div>
                  <div class="gesture-detail">屏幕左侧区域拖拽控制方向</div>
                </div>
              </div>
              <div class="gesture-item">
                <div class="gesture-icon"><RedoOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">调整视角方向</div>
                  <div class="gesture-detail">单指在屏幕右侧拖拽</div>
                </div>
              </div>
              <div class="gesture-item">
                <div class="gesture-icon"><ZoomInOutlined /></div>
                <div class="gesture-text">
                  <div class="gesture-action">前进/后退</div>
                  <div class="gesture-detail">双指向前/向后移动</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </a-modal>


  </div>
</template>

<script>
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';
import * as pc from 'playcanvas';
import CameraControls from '@/utils/controller';
import { Picker } from '@/utils/picker';
import { message, Modal } from 'ant-design-vue';
import {
  AppstoreOutlined,
  AimOutlined,
  SettingOutlined,
  EditOutlined,
  CaretRightOutlined,
  PauseOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ShareAltOutlined,
  ExportOutlined,
  CodeOutlined,
  CloseOutlined,
  CheckCircleFilled,
  MessageOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  ZoomInOutlined,
  DragOutlined,
  ArrowUpOutlined,
  ArrowLeftOutlined,
  VerticalAlignTopOutlined,
  RedoOutlined,
  MobileOutlined,
  BorderOutlined,
  BorderOuterOutlined,
  LeftOutlined,
  RightOutlined,
  CameraOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { createEffect, GsplatEffectType, removeAllEffects } from '@/utils/revel';
import { loadGsplat } from '@/utils/load';
import { Annotation,AnnotationManager } from '../../scripts/esm/annotations.mjs';
import { onMounted, onUnmounted } from 'vue';
import ShareDialog from '@/components/ShareDialog.vue';
import OfficialExportDialog from '@/components/OfficialExportDialog.vue';
import EmbedCodeDialog from '@/components/EmbedCodeDialog.vue';
import CustomMotion from '@/components/CustomMotion.vue';
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
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
import {Grid} from "../../scripts/esm/grid.mjs";  

const showToast = (input) => {
  const defaultDuration = 2

  if (typeof input === 'string') {
    message.info(input, defaultDuration)
    return
  }

  const content = input?.message || '操作提示'
  const duration = typeof input?.duration === 'number' ? input.duration / 1000 : defaultDuration

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

const resolveRequestErrorMessage = (error, defaultMessage) => {
  if (error?.message && String(error.message).length > 0) {
    return String(error.message)
  }

  switch (error?.statusCode) {
    case 400:
      return '请求错误，请检查输入'
    case 401:
      return '登录已过期，请重新登录'
    case 403:
      return '没有权限执行此操作'
    case 404:
      return '请求资源不存在'
    case 429:
      return '请求过于频繁，请稍后重试'
    case 500:
      return '服务器处理失败，请稍后重试'
    default:
      return defaultMessage
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
const pickDepthWgsl = /* wgsl */ `
    fn packFloat(depth: f32) -> vec4f {
        let u: vec4<u32> = (vec4<u32>(bitcast<u32>(depth)) >> vec4<u32>(0u, 8u, 16u, 24u)) & vec4<u32>(0xffu);
        return vec4f(u) / 255.0;
    }
    fn getPickOutput() -> vec4f {
        return packFloat(pcPosition.z);
    }
`;

function handleEscKey(e) {
  if (e.key === 'Escape') {
    // 退出所有模式和板块
    if (typeof closeAllPanels === 'function') closeAllPanels();
    if (typeof viewerControls !== 'undefined') viewerControls.showInfo = false;
    if (typeof isSettingsMenuOpen !== 'undefined') isSettingsMenuOpen = false;
    if (typeof isEditMenuOpen !== 'undefined') isEditMenuOpen = false;
    if (typeof isAnnotationEditMenuOpen !== 'undefined') isAnnotationEditMenuOpen = false;
    if (typeof showVideoEffectDialog !== 'undefined') showVideoEffectDialog = false;
    if (typeof isAnnotationDialogOpen !== 'undefined') isAnnotationDialogOpen = false;
    if (typeof showExportDialog !== 'undefined') showExportDialog = false;
    if (typeof showEmbedCodeDialog !== 'undefined') showEmbedCodeDialog = false;
    if (typeof showShareDialog !== 'undefined') showShareDialog = false;
    // 可补充其他自定义关闭逻辑
  }
}

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
const EFFECT_IMAGE_MAP = {
  0: '/effect-img/radial.jpg',
  1: '/effect-img/rain.jpg',
  2: '/effect-img/grid.jpg',
  3: '/effect-img/dissove.jpg',
  4: '/effect-img/latt.jpg',
};

const EFFECT_OPTIONS = [
  { id: 0, name: '径向', src: EFFECT_IMAGE_MAP[0] },
  { id: 1, name: '雨落', src: EFFECT_IMAGE_MAP[1] },
  { id: 2, name: '网格', src: EFFECT_IMAGE_MAP[2] },
  { id: 3, name: '溶解', src: EFFECT_IMAGE_MAP[3] },
  { id: 4, name: '晶格', src: EFFECT_IMAGE_MAP[4] },
];
export default {
  components:{
    OfficialExportDialog,
    ShareDialog,
    EmbedCodeDialog,
    CustomMotion,
    ColorPicker,
    AppstoreOutlined,
    AimOutlined,
    SettingOutlined,
    EditOutlined,
    CaretRightOutlined,
    PauseOutlined,
    VideoCameraOutlined,
    ReloadOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    ShareAltOutlined,
    ExportOutlined,
    CodeOutlined,
    CloseOutlined,
    CheckCircleFilled,
    MessageOutlined,
    QuestionCircleOutlined,
    SwapOutlined,
    ZoomInOutlined,
    DragOutlined,
    FullscreenExitOutlined ,
    ArrowUpOutlined,
    ArrowLeftOutlined,
    VerticalAlignTopOutlined,
    RedoOutlined,
    MobileOutlined,
    BorderOutlined,
    BorderOuterOutlined ,
    LeftOutlined,
    RightOutlined,
    CameraOutlined,
    DeleteOutlined,
  },
  props: {
    taskId: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      shouldShowAnnotation:true,
      fileChunks: {},
      task_id: this.taskId,
      token: token,
      task_name: '',
      fileName: '',
      customMotion: null,
      loopPlay: true,
      showCustomMotion: false,
      customMotionModelBuffer: null, // 模型arrayBuffer传递给CustomMotion
      customMotionCameraPose: null, // 初始相机pose传递给CustomMotion
      loading: false,
      loading_progress: 0,
      loading_status: '',
      showContorlWidget: false,
      isFeatureMenuExpanded: false,
      isFullscreen: false,
      showControls: true,
      controlsHideTimer: null,
      showFugai: false,
      cameraData:{},
      isLocal: false,
      name: "RenderTask",
      resizeObserver: null,
      isViewerLoading: false,
      uploadStatus: '',
      viewerControls: { ...DEFAULT_SETTINGS },
      isSettingsMenuOpen: false,
      app: null,
      canvas: null,
      device: null,
      shaderLanguage: 'glsl',
      currentTime: 0,
      uTime: null,
      resizeHandler: null,
      skullEntity: null,
      cameraEntity: null,
      cameraControls: null,
      sogConvertMessageKey: 'sog-convert-progress',
      sogConvertProgressText: '',
      dpr: 2,
      pixelScale: 1,
      lightEntity: null,
      sheetTranslateY: 0,
      isSheetExpanded: false,
      isSheetDragging: false,
      sheetMinHeight: 40,
      sheetMaxRatio: 0.7,
      isEditMenuOpen: false,
      axisList: [
        { key: 'x+', label: 'X+' },
        { key: 'x-', label: 'X-' },
        { key: 'y+', label: 'Y+' },
        { key: 'y-', label: 'Y-' },
        { key: 'z+', label: 'Z+' },
        { key: 'z-', label: 'Z-' }
      ],
      currentAxis: 'x+',
      axisValues: {
        'x+': 0, 'x-': 0,
        'y+': 0, 'y-': 0,
        'z+': 0, 'z-': 0
      },
      savedCropAxisValues: null,
      axisRange: {
        min: 0,
        max: 10,
        step: 0.01
      },
      currentAxisValue: 0,
      showConfirmModal: false,
      showSuccessModal: false,
      showGestureModal: false,
      showShareDialog: false,
      showExportDialog: false,
      showEmbedCodeDialog: false,
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
      originalSettings: null, // 进入设置面板时的设置快照，用于检测变化
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
      forceStartInteractionFlag: false,
      loopPlayStartDelayMs: 350,
      loopPlayStartTimer: null,
      autoLoopPlayTimer: null,
      rotateSpeed: 30,
      rotateTimer: null,
      sheetPanelHeight:0,
      sheetPanelOpacity:0,
      anchors:[], 
      rotation:0,
      gizmo :null,
      isClick: false,
      // ========== 视频录制/FFmpeg编码相关（替换原MediaRecorder） ==========
      isRecordingVideo: false, // 是否正在捕获帧
      isEncodingVideo: false,  // 是否正在FFmpeg编码MP4
      videoFrameList: [],      // 存储捕获的帧数据（base64）
      videoRecordProgress: 0,  // 帧捕获进度
      encodeProgress: 0,       // FFmpeg编码进度
      targetRotateAngle: 360,  // 目标旋转角度
      currentRotateAngle: 0,   // 当前旋转角度
      showVideoSuccessModal: false, // 视频成功弹窗
      generatedVideoBlob: null, // 最终MP4 Blob
      ffmpeg: null,            // FFmpeg实例
      videoFps: 30,            // 视频帧率（固定30帧，保证流畅）
      // 新增：视频特效选择对话框相关
      showVideoEffectDialog: false, // 特效选择对话框显示状态
      selectedVideoEffect: -1,      // 选中的特效：-1=无特效，0=径向，1=雨落，2=网格

      isAnnotationEditMenuOpen: false, // 标注编辑弹窗是否打开
      index: 0,
      manager: null,
      annotataions: [], // 存储编辑生成的标注
      defaultAnnotationEntity: null,
      isAnnotationDialogOpen: false,
      annotationDialogMode: 'view', // view | create | edit
      annotationForm: {
        title: '',
        text: ''
      },
      pendingAnnotationPosition: null,
      activeAnnotationEntity: null,
      showAnnotationExitConfirm: false,
      pendingAnnotationExitAction: null,
      lastTapTime: 0,
      annotationsSnapshot: null,
      annotationsSnapshotSerialized: '',
      currentAnnotationIndex: 0,
      effectOptions: EFFECT_OPTIONS,
      mouseDownPos: { x: 0, y: 0 },
      isMobile: false,
      showGrid: true,
      gridEntity: null,
      hasClickAnnotation:false,
      showAnnotationMenu: false,
      annotationMenuPosition: { x: 0, y: 0 },
      annotationMenuEntity: null,
      showSnapshotFlash: false,
      initialCameraPose: {}, // 初始相机位姿
    };
  },
  watch:{
    isEditMenuOpen(newVal){
      if (newVal) {
        this.stopLoopPlayback(false);
      }
    },
    orbitMotionType(newVal, oldVal) {
      // 切换到自定义运镜模式时，重置播放进度并自动开始播放
      if (newVal === 'custom') {
        this.orbitPlaybackAngle = 0;
        this.orbitPlaybackTravelled = 0;
        this.orbitPlaybackSessionStartAngle = 0;
        // 初始化播放状态
        if (!this.orbitPlaybackFocus) {
          this.initLoopPlaybackState();
        }
        // 自动开始播放
        if (this.customMotion && this.skullEntity && this.viewerControls.isOrbitMode) {
          this.applyCustomMotionAtTime(0);
          this.isLoopPlaying = true;
        }
      } else if (oldVal === 'custom') {
        // 从自定义模式切换回来时，重置为角度模式
        this.orbitPlaybackAngle = 0;
        this.orbitPlaybackTravelled = 0;
        this.isLoopPlaying = false;
      }
    },

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
      // 非闭环：最后一个关键帧的时间不算
      // 闭环：所有关键帧的时间都算
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
      // 自定义运镜模式
      if (this.isCustomMotionMode) {
        return this.customMotionTotalDuration;
      }
      // 其他运镜模式：360度 / 旋转速度
      const speed = this.viewerControls.autoRotateSpeed || 30;
      return 360 / speed;
    },
    // 当前时间（秒）
    orbitCurrentTime() {
      // 自定义运镜模式
      if (this.isCustomMotionMode) {
        return this.orbitPlaybackAngle; // 在自定义模式下直接使用时间值
      }
      // 其他运镜模式：当前角度 / 旋转速度
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

    // 返回上一个路由
    handleGoBack() {
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    },

    // 打开自定义运镜弹窗
    openCustomMotion() {
      this.showCustomMotion = true;
    },

    // 自定义运镜确认回调
    handleCustomMotionConfirm(motionData) {
      this.customMotion = motionData;
      this.orbitMotionType = 'custom';
      this.loopPlay = motionData.loopPlay !== false;
      this.showCustomMotion = false;
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
      console.log(this.currentAnnotationIndex)
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

    // 控制底部栏显示/隐藏
    showControlsTimer() {
      this.showControls = true;
      if (this.controlsHideTimer) {
        clearTimeout(this.controlsHideTimer);
      }
      // 当编辑面板打开时，不自动隐藏
      const isPanelOpen = this.viewerControls.showInfo ||
        this.isSettingsMenuOpen ||
        this.isEditMenuOpen ||
        this.showVideoEffectDialog;
      if (isPanelOpen) {
        return;
      }
      this.controlsHideTimer = setTimeout(() => {
        this.showControls = false;
      }, 3000);
    },
    handleMouseMove() {
      this.showControlsTimer();
    },
    handleClosePopup() {
        // 1. 先获取正确的滚动容器（确保ref绑定在可滚动的元素上）
        const effectListRef = this.$refs.effectListRef;
        
        // 2. 先关闭弹窗（通过$nextTick确保DOM更新后再执行滚动）
        this.viewerControls.showInfo = false;
        this.updateAnnotationVisibility();
        // 3. 等待DOM更新完成后执行滚动
        this.$nextTick(() => {
          if (effectListRef) {
            console.log('滚动容器：', effectListRef);
            // 兼容写法：优先使用scrollLeft（兼容性更好），fallback到scrollTo
            try {
              // 立即滚动到最左侧（去掉smooth避免动画导致的兼容性问题）
              effectListRef.scrollLeft = 0;
              effectListRef.scrollTop = 0;
              // 备选方案：scrollTo（带兼容处理）
              // effectListRef.scrollTo({
              //   left: 0,
              //   top: 0,
              //   behavior: 'auto' // 立即滚动，避免smooth的兼容性问题
              // });
            } catch (e) {
              console.error('滚动失败：', e);
              // 终极兜底：手动设置transform（如果是通过transform实现的滚动）
              effectListRef.style.transform = 'translateX(0)';
            }
          }
        });
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
          const vec = this.cameraDataToVector(this.cameraData);
          this.cameraControls.focusOnEntity(this.skullEntity, vec);
        }
      }
      this.showControlsTimer();
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
        case 'orbit':
        default:
          targetPos = applyOrbitMotion(options);
          break;
      }

      this.cameraControls.reset(this.orbitPlaybackFocus, targetPos, { immediate });
    },
    // 根据时间应用自定义运镜
    applyCustomMotionAtTime(currentTime) {
      if (!this.customMotion || !this.customMotion.keyframes || this.customMotion.keyframes.length < 2) return;
      if (!this.orbitPlaybackFocus || !this.cameraControls) return;

      const { keyframes, closedLoop, interpolationType } = this.customMotion;
      const totalDuration = this.customMotionTotalDuration;
      if (totalDuration <= 0) return;

      // 直接使用关键帧位置
      const pathPoints = keyframes.map(kf => {
        return new pc.Vec3(kf.position.x, kf.position.y, kf.position.z);
      });

      // 闭环模式：添加起点到末尾形成闭环
      if (closedLoop && keyframes.length >= 3) {
        const firstPoint = pathPoints[0].clone();
        pathPoints.push(firstPoint);
      }

      // 构建每段时间数组
      const segmentCount = closedLoop ? keyframes.length : keyframes.length - 1;
      const durations = [];
      for (let i = 0; i < segmentCount; i++) {
        durations.push(keyframes[i]?.time || 3);
      }

      // 获取缓动函数
      const easingMap = {
        'linear': Easing.linear,
        'easeIn': Easing.easeInCubic,
        'easeOut': Easing.easeOutCubic,
        'easeInOut': Easing.easeInOutCubic,
      };
      const easingFn = easingMap[interpolationType] || Easing.easeInOutCubic;

      // 使用 applyTimedPathMotion 计算目标位置
      const targetPos = applyTimedPathMotion(pathPoints, currentTime, durations, easingFn);

      this.cameraControls.reset(this.orbitPlaybackFocus, targetPos, { immediate: true });
    },
    normalizeOrbitAngle(angle) {
      const normalized = angle % 360;
      return normalized < 0 ? normalized + 360 : normalized;
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
    clearControlsHideTimer() {
      if (this.controlsHideTimer) {
        clearTimeout(this.controlsHideTimer);
        this.controlsHideTimer = null;
      }
    },
    hideOtherFeatureBubbles(except = null) {
      // 关闭标注菜单
      if (this.showAnnotationMenu) {
        this.closeAnnotationMenu();
      }
      if (except !== 'effect') {
        this.viewerControls.showInfo = false;
      }
      if (except !== 'settings') {
        this.isSettingsMenuOpen = false;
      }
      if (except !== 'video') {
        this.showVideoEffectDialog = false;
      }
      if (except !== 'edit' && this.isEditMenuOpen) {
        this.closeEditModal();
      }
      this.updateAnnotationVisibility();
    },
    closeInfoPanel() {
      this.viewerControls.showInfo = false;
      this.updateAnnotationVisibility();
    },
    closeSettingsPanel() {
      this.isSettingsMenuOpen = false;
      this.updateAnnotationVisibility();
      // if (this.hasSettingsChanged()) {
      //   Modal.confirm({
      //     title: '参数设置已修改',
      //     content: '参数设置相比进入时发生了变化，是否保存更改？',
      //     okText: '保存',
      //     cancelText: '不保存',
      //     onOk: () => {
      //       this.saveSettings();
      //       this.isSettingsMenuOpen = false;
      //       this.updateAnnotationVisibility();
      //     },
      //     onCancel: () => {
      //       this.restoreSettings();
      //       this.isSettingsMenuOpen = false;
      //       this.updateAnnotationVisibility();
      //     },
      //     zIndex: 1002,
      //   });
      // } else {
      //   this.isSettingsMenuOpen = false;
      //   this.updateAnnotationVisibility();
      // }
    },
    scheduleAutoLoopPlay(delayMs = 400) {
      this.clearAutoLoopPlayTimer();
      this.autoLoopPlayTimer = setTimeout(() => {
        this.autoLoopPlayTimer = null;
        if (!this.skullEntity || !this.viewerControls.isOrbitMode) return;
        if (this.isRecordingVideo || this.isEncodingVideo) return;
        if (this.isEditMenuOpen || this.isAnnotationEditMenuOpen || this.showVideoEffectDialog) return;
        if (this.isLoopPlaying) return;
        this.toggleLoopPlay();
      }, delayMs);
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
      if (!this.skullEntity || !this.viewerControls.isOrbitMode || this.isRecordingVideo || this.isEncodingVideo) return;
      if(this.autoLoopPlayTimer) return;
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
        // 如果没有焦点，先初始化
        if (!this.orbitPlaybackFocus) {
          const inited = this.initLoopPlaybackState();
          if (!inited) {
            showToast({ type: 'warning', message: '当前相机位置无法开始运镜' });
            return;
          }
        }
        if (!shouldDelayStart && !this.hasClickAnnotation) {
          this.applyCustomMotionAtTime(this.orbitPlaybackAngle, true);
          this.isLoopPlaying = true;
          return;
        }
        // 应用当前位置，使用非immediate模式实现平滑过渡
        this.applyCustomMotionAtTime(this.orbitPlaybackAngle, false);
        // 禁用缩放（设置zoomRange最小值为0）- 在设置timer之前保存，以便在timer被清除时也能恢复
        if (this.cameraControls) {
          this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
          this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
        }
        this.loopPlayStartTimer = setTimeout(() => {
          this.loopPlayStartTimer = null;
          if (!this.skullEntity || !this.viewerControls.isOrbitMode || this.isRecordingVideo || this.isEncodingVideo) return;
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
      // 禁用缩放（设置zoomRange最小值为0）
      if (this.cameraControls) {
        this.originalZoomRange = this.cameraControls.zoomRange ? { ...this.cameraControls.zoomRange } : null;
        this.cameraControls.zoomRange = new pc.Vec2(0, this.originalZoomRange ? this.originalZoomRange.y : 50);
      }
      if (!shouldDelayStart && !this.hasClickAnnotation) {
        this.applyOrbitAngle(startAngle, true);
        this.isLoopPlaying = true;
        return;
      }

      this.applyOrbitAngle(startAngle, false);
      this.loopPlayStartTimer = setTimeout(() => {
        this.loopPlayStartTimer = null;
        if (!this.skullEntity || !this.viewerControls.isOrbitMode || this.isRecordingVideo || this.isEncodingVideo) return;
        this.isLoopPlaying = true;
      }, this.loopPlayStartDelayMs);
      this.hasClickAnnotation = false;
    },
    handleOrbitProgressChange(value) {
      if (!this.skullEntity || !this.viewerControls.isOrbitMode || this.isRecordingVideo || this.isEncodingVideo) return;

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
      this.isLoopPlaying = false;
    },
    previewEffect(effectId) {
      this.selectedVideoEffect = effectId;
      if (effectId === -1) {
        removeAllEffects?.(this.skullEntity);
      } else {
        this.createEffect(effectId);
      }
    },

    createEffect(id){
      let type;
      switch(id){
        case 0:type= GsplatEffectType.RADIAL;break;
        case 1:type = GsplatEffectType.RAIN;break;
        case 2:type = GsplatEffectType.GRID;break;
        case 3:type= GsplatEffectType.DISSOLVE; break;
        case 4:type= GsplatEffectType.LATTICE; break;
      }
      if(this.skullEntity)
        createEffect(this.skullEntity, type)
    },
    async generateBinary3dgsSog(){
      return await this.cameraControls.generate3dgsFile(this.skullEntity, 'output.sog', true);
    },
    formatSogProgressText(payload = {}) {
      const base = payload.message || 'Processing SOG conversion...';
      const step = Number(payload.step || 0);
      const total = Number(payload.total || 0);
      if (total > 0 && step > 0) {
        const percent = Math.max(0, Math.min(100, Math.round((step / total) * 100)));
        return `${base} (${step}/${total}, ${percent}%)`;
      }
      return base;
    },
    handleSogConvertProgress(payload = {}) {
      const level = payload.level || 'info';
      const content = this.formatSogProgressText(payload);
      this.sogConvertProgressText = content;

      if (payload.done || level === 'success' || level === 'error') {
        const type = level === 'error' ? 'error' : 'success';
        message.open({
          key: this.sogConvertMessageKey,
          type,
          content,
          duration: 2
        });
        return;
      }

      const loadingLikeLevels = ['info', 'progress', 'log', 'debug', 'output'];
      const type = loadingLikeLevels.includes(level)
        ? 'loading'
        : (level === 'warn' ? 'warning' : 'loading');

      message.open({
        key: this.sogConvertMessageKey,
        type,
        content,
        duration: 0
      });
    },
    resetEntity(){
      if(this.cameraControls && this.skullEntity)
      {
        this.cameraControls.resetEntity(this.skullEntity);
        this.savedCropAxisValues = null;
        removeAllEffects?.(this.skullEntity);
        this.currentRotateAngle = 0;
        // this.skullEntity.setLocalEulerAngles(180, 0, 0);
        this.syncAllAxisValues();
      }
    },
    handleChangeRotation(rotation){
      this.rotation = rotation;
    },
    handleManualBack() {
      try {
        window.vueBackHandler();
      } catch (e) {
        console.error('返回失败：', e);
        if (this.$router.history.index > 0) {
          this.$router.go(-1);
        }
      }
    },
    updateCameraControlValue(key, value) {
      switch(key) {
        case 'moveSpeed':this.cameraControls.moveSpeed = value;break;
        case 'orbitSpeed':this.cameraControls.orbitSpeed = value;break;
        case 'autoRotateSpeed':this.cameraControls.autoRotateSpeed = value;break;
        case 'pinchSpeed':this.cameraControls.pinchSpeed = value;break;
        case 'originalFov':
          if(this.cameraEntity && this.cameraEntity.camera) {
            this.cameraEntity.camera.fov = value;
          }
          break;
      }
    },
    toggleFeatureMenu($event) {
      if(this.isRecordingVideo || this.isEncodingVideo) return;
      this.isFeatureMenuExpanded = !this.isFeatureMenuExpanded;
    },

    syncFullscreenState() {
      this.isFullscreen = !!document.fullscreenElement;
    },

    async toggleFullscreen($event) {
      if(this.isRecordingVideo || this.isEncodingVideo) return;
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

    toggleGrid() {
      if (!this.gridEntity) return;
      this.showGrid = !this.showGrid;
      this.gridEntity.enabled = this.showGrid;
    },

    handleExportPlaceholder($event) {
      this.showExportDialog = true;
    },

    handleEmbedCodePlaceholder($event) {
      this.showEmbedCodeDialog = true;
    },

    handleSharePlaceholder($event) {
      this.showShareDialog = true;
    },

    // 打开模型编辑菜单（原有逻辑迁移）
    openModelEditMenu($event = null) {
      if (!this.viewerControls.isOrbitMode) {
        showToast({ type: 'warning', message: '飞行模式下无法进入编辑' });
        return;
      }
      if (this.isAnnotationEditMenuOpen) {
        this.requestExitAnnotationEditMode('openModelEdit');
        return;
      }
      if (!this.isEditMenuOpen) {
        this.hideOtherFeatureBubbles('edit');
      }
      this.isEditMenuOpen = !this.isEditMenuOpen;
      this.isAnnotationEditMenuOpen = false;
      if (this.isEditMenuOpen) {
        this.stopLoopPlayback(false);
      }
      
      if (this.isEditMenuOpen) {
        if(this.skullEntity)
        {
          this.cameraControls?.drawEntityBoundingBox(this.skullEntity);
          const restored = this.applySavedAxisValues();
          if (!restored) {
            this.syncAllAxisValues();
          }
          this.selectAxis(this.currentAxis);
          this.cameraControls?.modifyBBoxFaceColor(this.skullEntity, this.currentAxis, "#ff3333")
        }
        this.updateAnnotationVisibility();
      } else {
        if(this.skullEntity)
        {
          this.cameraControls?.destroyEntityBoundingBox(this.skullEntity);
        }
        this.updateAnnotationVisibility();
      }
    },

    // 打开标注编辑菜单（新增）
    openAnnotationEditMenu($event = null) {
      if (!this.viewerControls.isOrbitMode) {
        showToast({ type: 'warning', message: '飞行模式下无法进入编辑' });
        return;
      }
      this.hideOtherFeatureBubbles(null);
      
      if (!this.isAnnotationEditMenuOpen) {
        this.isAnnotationEditMenuOpen = true
        this.annotationsSnapshot = this.getAnnotationSnapshot();
        this.annotationsSnapshotSerialized = this.serializeAnnotationSnapshot(this.annotationsSnapshot);
        this.clearLoopPlayStartTimer();
        this.isLoopPlaying = false;
        this.app && this.app.fire('annotation:editMode', true);
        this.updateAnnotationVisibility();
        // 可添加标注编辑的初始化逻辑
      } else {
        this.requestExitAnnotationEditMode();
      }
    },

    requestExitAnnotationEditMode(action = null) {
      this.pendingAnnotationExitAction = action;
      if (!this.hasAnnotationChanges()) {
        this.finalizeExitAnnotationEditMode(false, false);
        return;
      }
      this.showAnnotationExitConfirm = true;
    },

    confirmExitAnnotationEditMode(shouldSave) {
      this.finalizeExitAnnotationEditMode(shouldSave, true);
    },

    cancelExitAnnotationEditMode() {
      this.showAnnotationExitConfirm = false;
      this.pendingAnnotationExitAction = null;
    },

    executePendingAnnotationExitAction() {
      const action = this.pendingAnnotationExitAction;
      this.pendingAnnotationExitAction = null;
      if (!action) return;

      if (action === 'openModelEdit') {
        this.openModelEditMenu();
      } else if (action === 'openVideoEffect') {
        this.openVideoEffectDialog();
      }
    },

    updateAnnotationVisibility() {
      this.shouldShowAnnotation = this.isAnnotationEditMenuOpen ||
        (!this.isEditMenuOpen && !this.showVideoEffectDialog && !this.isRecordingVideo && !this.isEncodingVideo && !this.viewerControls.showInfo
         );

      this.annotataions.forEach(item => {
        if (item) item.enabled =this.shouldShowAnnotation ;
      });

      if (this.defaultAnnotationEntity) {
        this.defaultAnnotationEntity.enabled =this.shouldShowAnnotation ;
      }
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

    getCurrentCameraPose(focusOverride = null) {
      if (!this.cameraEntity) return null;
      const cameraPosition = this.cameraEntity.getPosition();
      const fallbackFocus = focusOverride || this.getModelCenter();
      if (!fallbackFocus) return null;

      return this.normalizeCameraPose({
        position: {
          x: cameraPosition.x,
          y: cameraPosition.y,
          z: cameraPosition.z
        },
        focus: {
          x: fallbackFocus.x,
          y: fallbackFocus.y,
          z: fallbackFocus.z
        }
      });
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

    getAnnotationSnapshot() {
      return this.annotataions.map(item => {
        const script = item?.script?.annotation;
        const position = item?.getPosition?.();
        return {
          label: script?.label ?? '',
          title: script?.title ?? '',
          text: script?.text ?? '',
          size: script?.size ?? 1,
          cameraPose: this.normalizeCameraPose(script?.cameraPose),
          x: position?.x ?? 0,
          y: position?.y ?? 0,
          z: position?.z ?? 0,
          __fromServer: !!item?.__fromServer
        };
      });
    },

    serializeAnnotationSnapshot(snapshot) {
      const normalized = (snapshot || []).map(item => ({
        label: String(item.label),
        title: String(item.title),
        text: String(item.text),
        size: Number(item.size) || 1,
        cameraPose: this.normalizeCameraPose(item.cameraPose),
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        z: Number(item.z) || 0,
        __fromServer: !!item.__fromServer
      })).sort((a, b) => {
        if (a.label === b.label) return 0;
        return a.label > b.label ? 1 : -1;
      }).map(item => ({
        ...item,
        cameraPose: item.cameraPose ? {
          position: {
            x: Number(item.cameraPose.position.x.toFixed(6)),
            y: Number(item.cameraPose.position.y.toFixed(6)),
            z: Number(item.cameraPose.position.z.toFixed(6))
          },
          focus: {
            x: Number(item.cameraPose.focus.x.toFixed(6)),
            y: Number(item.cameraPose.focus.y.toFixed(6)),
            z: Number(item.cameraPose.focus.z.toFixed(6))
          }
        } : null,
        x: Number(item.x.toFixed(6)),
        y: Number(item.y.toFixed(6)),
        z: Number(item.z.toFixed(6))
      }));
      return JSON.stringify(normalized);
    },

    hasAnnotationChanges() {
      const current = this.serializeAnnotationSnapshot(this.getAnnotationSnapshot());
      return current !== (this.annotationsSnapshotSerialized || '');
    },

    restoreAnnotationsFromSnapshot() {
      if (!this.annotationsSnapshot) return;
      this.clearAllAnnotations();
      let maxLabel = 0;
      this.annotationsSnapshot.forEach(item => {
        const annotationEntity = new pc.Entity(`annotation_${item.label}`);
        annotationEntity.setLocalPosition(Number(item.x), Number(item.y), Number(item.z));
        annotationEntity.__fromServer = !!item.__fromServer;
        annotationEntity.addComponent('script');
        annotationEntity.script.create(Annotation, {
          properties: {
            label: String(item.label),
            title: item.title,
            text: item.text,
            size: Number(item.size) || 1,
            cameraPose: this.normalizeCameraPose(item.cameraPose),
          }
        });
        this.app.root.addChild(annotationEntity);
        this.annotataions.push(annotationEntity);
        const numericLabel = Number.parseInt(item.label, 10);
        if (Number.isFinite(numericLabel)) maxLabel = Math.max(maxLabel, numericLabel);
      });
      this.index = maxLabel;
      this.updateAnnotationVisibility();
    },

    finalizeExitAnnotationEditMode(shouldSave, restoreOnDiscard) {
      this.showAnnotationExitConfirm = false;
      // 关闭标注菜单
      this.closeAnnotationMenu();
      if (shouldSave) {
        this.exportAnnotationsJson();
        this.annotationsSnapshot = this.getAnnotationSnapshot();
        this.annotationsSnapshotSerialized = this.serializeAnnotationSnapshot(this.annotationsSnapshot);
      } else if (restoreOnDiscard) {
        this.restoreAnnotationsFromSnapshot();
      }
      this.isAnnotationEditMenuOpen = false;
      this.clearLoopPlayStartTimer();
      this.isLoopPlaying = false;
      this.app && this.app.fire('annotation:editMode', false);
      this.updateAnnotationVisibility();
      this.executePendingAnnotationExitAction();
    },

    async exportAnnotationsJson() {
      const annotationsData = [];
      this.annotataions
        .map(item => {
          const script = item?.script?.annotation;
          if (!script) return null;
          const position = item.getPosition();
          const title= script.title;
          const text= script.text;
          const tempObject = {
            label: title,
            description: text,
            x: position.x.toString(),
            y: position.y.toString(),
            z: position.z.toString(),
            cameraPose: this.normalizeCameraPose(script?.cameraPose)
          }
          annotationsData.push(tempObject);
        })
        try{
          const response = await ApiServer.request({
            method: 'post',
            url: API.CREATE_ANNOTATION,
            data: {
            taskId: this.task_id,
            data: annotationsData
            }
          });
          // console.log(response.data);
          this.annotataions.forEach(item => {
            if (item) item.__fromServer = true;
          });
          showToast('标注保存成功');
        }catch(error){
          console.error('保存标注失败：', error);
          showToast(resolveRequestErrorMessage(error, '标注保存失败'));
        }
        
    },

    clearAllAnnotations() {
      const list = [...this.annotataions];
      list.forEach(item => item?.destroy());
      this.annotataions = [];
      this.activeAnnotationEntity = null;
      this.pendingAnnotationPosition = null;
    },

    clearNewAnnotations() {
      const kept = [];
      this.annotataions.forEach(item => {
        if (item?.__fromServer) {
          kept.push(item);
        } else {
          item?.destroy();
        }
      });
      this.annotataions = kept;
      if (this.activeAnnotationEntity && !this.activeAnnotationEntity.__fromServer) {
        this.activeAnnotationEntity = null;
      }
      this.pendingAnnotationPosition = null;
    },

    openAnnotationDialog(mode, entity = null) {
      this.annotationDialogMode = mode;
      this.activeAnnotationEntity = entity;
      if (mode === 'create') {
        this.annotationForm.title = '';
        this.annotationForm.text = '';
      } else if (entity?.script?.annotation) {
        this.annotationForm.title = entity.script.annotation.title || '';
        this.annotationForm.text = entity.script.annotation.text || '';
      }
      setTimeout(() => {
        this.isAnnotationDialogOpen = true;
      }, 0);
    },

    closeAnnotationDialog() {
      this.isAnnotationDialogOpen = false;
      this.activeAnnotationEntity = null;
      this.pendingAnnotationPosition = null;
    },

    // 关闭标注菜单
    closeAnnotationMenu() {
      this.showAnnotationMenu = false;
      this.annotationMenuEntity = null;
    },

    // 处理编辑标注
    handleAnnotationEdit() {
      if (this.annotationMenuEntity) {
        this.openAnnotationDialog('edit', this.annotationMenuEntity);
      }
      this.closeAnnotationMenu();
    },

    // 处理快照功能 - 更新annotation保存的位姿信息
    handleAnnotationSnapshot() {
      if (this.annotationMenuEntity && this.cameraEntity && this.cameraControls) {
        // 获取标注位置作为focus
        const annotationPos = this.annotationMenuEntity.getPosition();
        // 获取当前相机位置
        const cameraPos = this.cameraEntity.getPosition();
        // 更新annotation的cameraPose为当前相机位置
        const newCameraPose = {
          position: {
            x: cameraPos.x,
            y: cameraPos.y,
            z: cameraPos.z
          },
          focus: {
            x: annotationPos.x,
            y: annotationPos.y,
            z: annotationPos.z
          }
        };
        // 更新annotation的cameraPose
        if (this.annotationMenuEntity.script && this.annotationMenuEntity.script.annotation) {
          this.annotationMenuEntity.script.annotation.cameraPose = newCameraPose;
        }
        // 显示边框变白效果
        this.showSnapshotFlash = true;
        setTimeout(() => {
          this.showSnapshotFlash = false;
        }, 200);
        showToast('快照已更新');
      }
      this.closeAnnotationMenu();
    },

    // 处理删除标注
    handleAnnotationDelete() {
      if (this.annotationMenuEntity) {
        // 调用删除逻辑
        this.activeAnnotationEntity = this.annotationMenuEntity;
        this.deleteAnnotation();
      }
      this.closeAnnotationMenu();
    },

    confirmAnnotationDialog() {
      // console.log(this.index)
      if (this.annotationDialogMode === 'create') {
        if (!this.pendingAnnotationPosition) {
          this.closeAnnotationDialog();
          return; 
        }
        const nextLabel = this.getNextAnnotationLabel();
        const annotation = new pc.Entity(`annotation_${nextLabel}_${Date.now()}`);
        annotation.setLocalPosition(this.pendingAnnotationPosition);
        annotation.__fromServer = false;
        annotation.addComponent('script');
        const cameraPose = this.getCurrentCameraPose(this.pendingAnnotationPosition);
        annotation.script.create(Annotation, {
          properties: {
            label: String(nextLabel),
            title: this.annotationForm.title || `annotation_${nextLabel}`,
            text: this.annotationForm.text || '',
            cameraPose
          }
        });
        this.app.root.addChild(annotation);
        this.annotataions.push(annotation);
        this.index = nextLabel; // Update index to nextLabel
        this.closeAnnotationDialog();
        return;
      }

      if (this.annotationDialogMode === 'edit' && this.activeAnnotationEntity?.script?.annotation) {
        this.activeAnnotationEntity.script.annotation.title = this.annotationForm.title || '';
        this.activeAnnotationEntity.script.annotation.text = this.annotationForm.text || '';
        this.closeAnnotationDialog();
        return;
      }

      this.closeAnnotationDialog();
    },

    deleteAnnotation() {
      const entity = this.activeAnnotationEntity;
      if (!entity) {
        this.closeAnnotationDialog();
        return;
      }
      const index = this.annotataions.findIndex(item => item === entity);
      if (index >= 0) this.annotataions.splice(index, 1);
      entity.destroy();
      this.activeAnnotationEntity = null;
      this.closeAnnotationDialog();
    },

    getNextAnnotationLabel() {
      const labels = this.annotataions
        .map(item => Number.parseInt(item?.script?.annotation?.label, 10))
        .filter(value => Number.isFinite(value));
      return labels.length ? Math.max(...labels) + 1 : 1;
    },

    onAnnotationRemove(annotationScript) {
      // console.log('onAnnotationRemove', annotationScript);
      const entity = annotationScript?.entity;
      if (!entity) return;
      const index = this.annotataions.findIndex(item => item === entity);
      if (index >= 0) this.annotataions.splice(index, 1);
      if (this.activeAnnotationEntity === entity) {
        this.closeAnnotationDialog();
      }
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

      if (this.isAnnotationEditMenuOpen) {
        // 编辑模式下，显示编辑/快照菜单
        this.annotationMenuEntity = entity;
        const hotspotDom = this.manager._annotationResources.get(annotationScript).hotspotDom
        console.log(hotspotDom )
        const rect = hotspotDom.getBoundingClientRect();
        this.annotationMenuPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top - rect.height
        };
        this.showAnnotationMenu = true;
      } else {
        this.stopLoopPlayback(false);
        this.hasClickAnnotation = true;
        this.viewerControls.isOrbitMode = true;
        this.applyAnnotationCameraPose(annotationScript);
      }
    },

    // 更新编辑框位置，使其跟随 hotspotDom
    updateAnnotationMenuPosition() {
      if (!this.annotationMenuEntity || !this.manager) return;

      const annotationScript = this.annotationMenuEntity.script?.annotation;
      if (!annotationScript) return;

      const hotspotDom = this.manager._annotationResources.get(annotationScript)?.hotspotDom;
      if (!hotspotDom) return;

      const rect = hotspotDom.getBoundingClientRect();
      this.annotationMenuPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top - rect.height
      };
    },

    // 重写closeAllPanels方法，新增关闭编辑面板
    closeAllPanels() {
      return;
    },
    closeEditModal() {
      this.isEditMenuOpen = false;
      if(this.skullEntity)
      {
        this.cameraControls?.destroyEntityBoundingBox(this.skullEntity);
      }
      this.updateAnnotationVisibility();
    },
    syncAllAxisValues() {
      if (!this.skullEntity || !this.cameraControls) return;
      this.axisList.forEach(axis => {
        const faceValue = this.cameraControls?.getFaceLocalPosition(this.skullEntity, axis.key);
        if (Number.isFinite(Number(faceValue))) {
          this.axisValues[axis.key] = Number(faceValue);
        }
      });
      const currentValue = this.axisValues[this.currentAxis];
      if (Number.isFinite(Number(currentValue))) {
        this.currentAxisValue = Number(currentValue);
      }
    },
    saveCurrentAxisValuesToSession() {
      if (!this.skullEntity || !this.cameraControls) return;
      this.syncAllAxisValues();
      const snapshot = {};
      this.axisList.forEach(axis => {
        const value = Number(this.axisValues?.[axis.key]);
        if (Number.isFinite(value)) {
          snapshot[axis.key] = value;
        }
      });
      this.savedCropAxisValues = Object.keys(snapshot).length ? snapshot : null;
    },
    applySavedAxisValues() {
      if (!this.skullEntity || !this.cameraControls || !this.savedCropAxisValues) return false;
      this.axisList.forEach(axis => {
        const rawValue = this.savedCropAxisValues?.[axis.key];
        if (!Number.isFinite(Number(rawValue))) return;
        const range = this.getAxisRange(axis.key);
        const clampedValue = this.clamp(Number(rawValue), range.min, range.max);
        this.axisValues[axis.key] = clampedValue;
        this.cameraControls?.modifyBboxFacePosition(this.skullEntity, axis.key, clampedValue);
      });
      this.syncAllAxisValues();
      return true;
    },
    selectAxis(axisKey) {
      this.currentAxis = axisKey;
      if(this.skullEntity)
      {
        this.cameraControls?.clearBBoxFaceColor(this.skullEntity)
        this.cameraControls?.modifyBBoxFaceColor(this.skullEntity, this.currentAxis, "#ff3333")
        this.currentAxisValue = this.cameraControls?.getFaceLocalPosition(this.skullEntity, this.currentAxis);
        this.axisValues[axisKey] = this.currentAxisValue;
        this.updateSliderRange();
      }
    },
    getAxisRange(axisKey) {
      const limitList = this.cameraControls?.calculateAabbAxisLimits(this.skullEntity)?.[axisKey[0]];
      const min = Number(limitList?.[0] ?? 0);
      const max = Number(limitList?.[1] ?? 10);
      return {
        min,
        max,
        step: 0.01
      };
    },
    handleAxisValueChange(axisKey, value) {
      if (!this.skullEntity || !this.cameraControls) return;
      const range = this.getAxisRange(axisKey);
      const clampedValue = this.clamp(Number(value) || 0, range.min, range.max);
      this.currentAxis = axisKey;
      this.currentAxisValue = clampedValue;
      this.axisValues[axisKey] = clampedValue;
      this.cameraControls?.clearBBoxFaceColor(this.skullEntity)
      this.cameraControls?.modifyBBoxFaceColor(this.skullEntity, this.currentAxis, "#ff3333")
      this.cameraControls?.modifyBboxFacePosition(this.skullEntity, axisKey, clampedValue);
    },
    updateSliderRange() {
      const limitList = this.cameraControls?.calculateAabbAxisLimits(this.skullEntity)[this.currentAxis[0]];
      this.axisRange.min = limitList[0];
      this.axisRange.max = limitList[1];
      const min = this.axisRange.min ?? 0;
      const max = this.axisRange.max ?? 10;
      if (min > max) {
        showToast({ type: 'warning', message: '最小值不能大于最大值' });
        this.axisRange.min = max - 10;
        this.axisRange.max = max;
        return;
      }
      this.currentAxisValue = this.clamp(
        this.currentAxisValue,
        this.axisRange.min,
        this.axisRange.max
      );
    },
    handleSliderChange(value) {
      const clampedValue = this.clamp(value, this.axisRange.min, this.axisRange.max);
      this.currentAxisValue = clampedValue;
      this.axisValues[this.currentAxis] = clampedValue;
      this.cameraControls?.modifyBboxFacePosition(this.skullEntity, this.currentAxis, this.currentAxisValue);
    },
    saveCropSettings(show = true) {
      if (this.skullEntity && this.cameraControls) {
        this.saveCurrentAxisValuesToSession();
        this.cameraControls?.clipGsplatDataByAllFaces(this.skullEntity);
        this.closeEditModal();
        if (show) {
          showToast("保存成功");
        }
      }
    },
    showCoverConfirmModal() {
      this.showConfirmModal = true;
    },
    closeConfirmModal() {
      this.showConfirmModal = false;
    },
    async confirmSaveChanges() {
      this.saveCropSettings(false);
      this.showConfirmModal = false;
      this.closeEditModal();
      this.savedCropAxisValues = null;
      this.cameraControls?.clipGsplatDataByAllFaces(this.skullEntity);
      
      const arrayBuffer = await this.generateBinary3dgsSog();
      await this.renderFromArrayBuffer('output.sog', arrayBuffer);
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = this.fileName || 'output.sog';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      // const arrayBufferToBase64 = (buffer) => {
      //   const uint8Array = new Uint8Array(buffer);
      //   let binaryString = '';
      //   for (let i = 0; i < uint8Array.length; i++) {
      //     binaryString += String.fromCharCode(uint8Array[i]);
      //   }
      //   return btoa(binaryString);
      // };
      // const plyBase64 = arrayBufferToBase64(arrayBuffer);
      // this.closeEditModal();
      // // this.showSuccessModal = true;
      // await this.renderFromArrayBuffer(this.fileName, arrayBuffer);
      // window.flutter_inappwebview.callHandler(
      //   "FlutterSavePlyChannel", 
      //   plyBase64
      // );
    },
    closeSuccessModal() {
      this.showSuccessModal = false;
    },
    confirmGeneratePlyFile() {
      return this.cameraControls?.generate3dgsPlyFile(this.skullEntity,"", false);
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    retryLoadModel() {
      if (this.isView && this.viewData) {
        this.isViewerLoading = true;
        this.renderFromArrayBuffer(this.viewFileName, this.viewData);
      } else {
        showToast({ type: 'warning', message: '暂无可用的模型数据' });
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
        this.shaderLanguage = this.device.isWebGPU ? 'wgsl' : 'glsl';
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
        pc.ShaderChunks.get(this.app.graphicsDevice, 'glsl').set('pickPS', pickDepthGlsl);
        pc.ShaderChunks.get(this.app.graphicsDevice, 'wgsl').set('pickPS', pickDepthWgsl);
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
        this.app.on('destroy', () => {
          window.removeEventListener('resize', this.resizeHandler);
        });
        this.cameraEntity = new pc.Entity('camera');
        this.cameraEntity.addComponent('camera', {
            fov: this.viewerControls.originalFov,
            frustumCulling: true,
            clearColor: new pc.Color(0, 0, 0, 0)
        });
        this.app.root.addChild(this.cameraEntity);
        this.cameraEntity.camera.requestSceneColorMap(true);
        this.cameraControls = new CameraControls(this.app, this.cameraEntity.camera, null);
        this.cameraControls.setSogProgressHandler(this.handleSogConvertProgress);
        // 设置模式切换回调
        this.cameraControls.setModeChangeCallback((mode) => {
          // this.cameraControls.mode = mode;
          // 可同步其它状态
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
        const gridEntity = new pc.Entity('grid');
        gridEntity.addComponent('script');
        gridEntity.script.create(Grid, {
          properties:{
            resolution : 2,
          }
        });
        gridEntity.setLocalScale(1000, 1, 1000);
        this.app.root.addChild(gridEntity);
        this.gridEntity = gridEntity;
        const gizmoLayer = new pc.Layer({
            name: 'Gizmo',
            clearDepthBuffer: true,
            opaqueSortMode: pc.SORTMODE_NONE,
            transparentSortMode: pc.SORTMODE_NONE
        });
        this.app.scene.layers.push(gizmoLayer);
        const picker = new Picker(this.app, this.cameraEntity);
         this.canvas.addEventListener('mousedown', (event) => {
          this.mouseDownPos = { x: event.clientX, y: event.clientY };
        });
         this.canvas.addEventListener('click', async (event) => {
          if (this.mouseDownPos) {
            const dx = event.clientX - this.mouseDownPos.x;
            const dy = event.clientY - this.mouseDownPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) return; // 超过5px认为是拖拽，不处理点击
          }
          // 点击空白处时关闭标注菜单
          if (this.showAnnotationMenu) {
            this.closeAnnotationMenu();
            return;
          }
          if (this.viewerControls.isOrbitMode && event.target === this.canvas && !this.isRecordingVideo && !this.isEncodingVideo) {
              // 确保bicycle和拾取器都已初始化
              if (!this.skullEntity || !picker) return;

              const rect = this.canvas.getBoundingClientRect();
              // 计算标准化的拾取坐标（关键：要考虑this.Canvas的缩放和偏移）
              const bufferX = Math.floor((event.clientX - rect.left) * (this.canvas.width / rect.width));
              const bufferY = Math.floor((event.clientY - rect.top) * (this.canvas.height / rect.height));
              
              const result = await picker.pick(bufferX, bufferY, this.canvas.width, this.canvas.height);
              
              if (result) {
                  if (!this.isAnnotationEditMenuOpen) {
                      // 非编辑模式：统一双击/双触发
                      const now = Date.now();
                      if (now - this.lastTapTime < 300) {
                        this.lastTapTime = 0;
                        this.cameraControls.reset(result, this.cameraEntity.getPosition());
                      } else {
                        this.lastTapTime = now;
                      }
                  } else {
                    // 编辑模式：先弹出输入框，确认后再创建
                    this.pendingAnnotationPosition = new pc.Vec3(result.x, result.y, result.z);
                    this.openAnnotationDialog('create');
                  }
              }
          }
      });
        this.app.start();
        this.app.on('annotation:click', this.onAnnotationClick);
        this.app.on('annotation:remove', this.onAnnotationRemove);
        // 初始化FFmpeg（关键：CDN引入后初始化，配置日志和进度）
        await this.initFFmpeg();
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
    handleUpdate(dt) {
      this.currentTime += dt;
      if (this.uTime) {
        this.uTime.setValue(this.currentTime);
      }

      const shouldStopByUserInput = !!this.cameraControls?.hasUserInteracted;
      if (shouldStopByUserInput && (this.isLoopPlaying || this.loopPlayStartTimer)) {
        this.cameraControls?.resetUserInteractionFlag?.();
        this.stopLoopPlayback(false);
      }
      
      if (this.isLoopPlaying && !this.isRecordingVideo && !this.isEncodingVideo) {
        // 自定义运镜模式：使用时间驱动
        if (this.isCustomMotionMode) {
          const totalDuration = this.customMotionTotalDuration;
          if (totalDuration > 0) {
            // 累加时间
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

      if (this.isRecordingVideo && !this.isEncodingVideo) {
        // 视频录制时使用当前选中的运镜方式
        if (this.orbitMotionType === 'custom' && this.customMotion) {
          // 自定义运镜模式：使用时间驱动
          const totalDuration = this.customMotionTotalDuration;
          if (totalDuration > 0) {
            this.currentRotateAngle += dt;
            if (this.currentRotateAngle >= totalDuration) {
              // 自定义运镜完成一圈，停止录制（达到目标角度）
              this.currentRotateAngle = this.targetRotateAngle;
            }
            this.applyCustomMotionAtTime(this.currentRotateAngle);
          }
        } else {
          // 其他运镜模式：使用角度驱动
          this.currentRotateAngle += (this.cameraControls?.autoRotateSpeed || 30) * dt;
          const clampedAngle = Math.min(this.currentRotateAngle, this.targetRotateAngle);
          this.applyOrbitAngle(clampedAngle, true);
        }
      }

      this.cameraControls?.update(dt, false, this.isRecordingVideo || this.isEncodingVideo, this.isEditMenuOpen
         || this.isAnnotationEditMenuOpen
      );

      // 实时更新编辑框位置
      if (this.showAnnotationMenu && this.isAnnotationEditMenuOpen && this.annotationMenuEntity) {
        this.updateAnnotationMenuPosition();
      }

    },
    updateDownloadInfo(options) {
      const optionsObj = JSON.parse(options);
      this.isViewerLoading = optionsObj.isDownloading;
      this.loading_progress = optionsObj.downloadPercentage;
      this.loading_status =  optionsObj.downloadStatus;
    },
    prepareFileReceive(fileName, totalChunks, isLocal, showFugai, task_id, task_name) {
      this.showFugai = showFugai;
      this.fileName = fileName;
      this.isLocal = isLocal;
      this.task_id = task_id;
      this.task_name = task_name;
      this.fileChunks = { chunks: new Array(totalChunks), total: totalChunks, received: 0 };
      console.log(`准备接收文件 ${fileName}，共 ${totalChunks} 块`);
      this.isViewerLoading = true;
      this.loading_status = '';
    },
    receiveFileChunk(fileName, chunkIndex, chunkData) {
      const fileInfo = this.fileChunks;
      if (!fileInfo) { console.error(`未初始化文件 ${fileName} 的接收`); return; }
      fileInfo.chunks[chunkIndex] = chunkData;
      fileInfo.received++;
      if(this.isLocal)
        this.loading_progress = Number.parseFloat(((fileInfo.received / fileInfo.total) * 100).toFixed(1));
      else
        this.loading_progress =Number.parseFloat((90 + 0.1 * (fileInfo.received / fileInfo.total) * 100).toFixed(2));
      if (fileInfo.received === fileInfo.total) {
        const fullBase64 = fileInfo.chunks.join('');
        const base64Data = fullBase64.replace(/^data:.+;base64,/, '');
        const binaryStr = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryStr.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryStr.length; i++) { uint8Array[i] = binaryStr.charCodeAt(i); }
        this.renderFromArrayBuffer(fileName, uint8Array);
        delete this.fileChunks;
        this.showContorlWidget = true;
        this.$nextTick(() => { window.gc?.(); });
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
        console.log(fileUrl)  
        await this.loadSplatAsset(fileName, fileUrl);
      } catch (error) {
        this.isViewerLoading = false;
        console.log(`解析模型失败：${error.message}`);
      }
    },
    async getTargetModel(mode = 'view', format = 'ply') {
      try {
        if(mode === 'view')
        {
          this.isViewerLoading = true;
          const response = await ApiServer.request({
            method: 'get',
            url: `${API.DOWNLOAD_OFFICIAL_MODEL}/${this.task_id}`,
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                this.loading_progress = Number.parseFloat((progressEvent.loaded / progressEvent.total * 100).toFixed(2));
              }
            }
          });
          const data = response.data;
          console.log(data);
          const fileName = `${this.task_name || 'model'}.${format}`;
          await this.renderFromArrayBuffer(fileName, data);
          this.scheduleAutoLoopPlay();
          this.showControlsTimer();
        }


      } catch (error) {
        let errMsg = "获取下载token失败";
        console.log(error)
        if (error?.message && String(error.message).length > 0) {
          showToast(error.message);
          return null;
        }
        switch (error?.statusCode) {
          case 401:
            showToast('登录已过期，请重新登录');
            window.localStorage.removeItem('api_token');
            setTimeout(() => { window.location.href = '/login'; }, 1500);
            return null;
          case 500:
            errMsg = '服务器处理失败，请稍后重试';
            break;
          default:
            errMsg = '获取下载token失败';
            break;
        }
        showToast(errMsg);
        return null;
      }finally {
        this.isViewerLoading = false;
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
      this.skullEntity = new pc.Entity('custom-splat');
      this.skullEntity.addComponent('gsplat', { asset: splatAsset});
      // this.skullEntity.setLocalEulerAngles(180, 0, 0);
      // annotation.enabled = false; // 默认隐藏
      let annotationsData = [];
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: API.GET_ANNOTATIONS,
          params: {
            taskId: this.task_id
          }
        });
        // console.log("data", response.data);
        annotationsData = response.data.data || [];
      } catch (e) {
        //
      }
      this.app.root.addChild(this.skullEntity);
      if(this.skullEntity) {
        console.log(this.skullEntity)
        let vec, cameraPose;
        if(this.initialCameraPose?.cameraPosition && this.initialCameraPose?.focus)
        {
          const position = this.initialCameraPose?.cameraPosition
          const focus = this.initialCameraPose?.focus
          vec = new pc.Vec3(position.x, position.y, position.z).clone().sub(
                new pc.Vec3(focus.x, focus.y ,focus.z)) ;
          cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, vec);
        }
        else
        {
          vec = this.cameraDataToVector(this.cameraData)
          cameraPose = this.cameraControls?.focusOnEntity(this.skullEntity, vec);
          this.initialCameraPose = cameraPose
          this.saveSettings(false);
        }
        // 保存cameraPose用于传递给CustomMotion
        this.customMotionCameraPose = cameraPose;
        this.initLoopPlaybackState(cameraPose);
        const aabb = this.cameraControls?.calculateEntityAabb(this.skullEntity);
        const bottomPose = aabb.center.clone().sub(new pc.Vec3(0, aabb.halfExtents.y, 0));
        this.gridEntity.setPosition(bottomPose);
        this.cameraControls?.resetUserInteractionFlag?.();
        this.skullEntity.addComponent('script');
        
        this.manager = this.skullEntity.script.create(AnnotationManager);
        const annotation = new pc.Entity(`annotation_default`);
        annotation.setPosition(aabb.center);
        this.defaultAnnotationEntity = annotation;
        annotation.addComponent('script');
        annotation.script.create(Annotation, {
          properties: {
            label: String(0),
            title: this.annotationForm.title || `annotation_default`,
            text: this.annotationForm.text || '',
            size: 0.01,
          }
        });
        
        annotationsData.forEach((item,index) => {
          const annotationEntity = new pc.Entity(`annotation_${item.label}`);
          annotationEntity.setLocalPosition(parseFloat(item.x), parseFloat(item.y), parseFloat(item.z));
          annotationEntity.__fromServer = true;
          annotationEntity.addComponent('script');
          const cameraPose = this.parseServerCameraPose(item);
          annotationEntity.script.create(Annotation, {
            properties: {
              label: String(index+1),
              title: item.label,
              text: item.description,
              size: 1,
              cameraPose,
            }
          });
          this.app.root.addChild(annotationEntity);
          this.annotataions.push(annotationEntity);
        });
        this.app.root.addChild(annotation);
        this.updateAnnotationVisibility();
        
         // 初始化注释快照，用于后续变更检测
        this.annotationsSnapshot = this.getAnnotationSnapshot();
        this.annotationsSnapshotSerialized = this.serializeAnnotationSnapshot(this.annotationsSnapshot);

      }
      this.app.off('update', this.handleUpdate);
      this.app.on('update', this.handleUpdate);
      URL.revokeObjectURL(fileUrl);
      this.loading_status = 'success';
      this.isViewerLoading = false;
    },
    toggleInfoPanel($event = null) {
      if(this.isRecordingVideo || this.isEncodingVideo) return;
      if (!this.viewerControls.showInfo) {
        this.hideOtherFeatureBubbles('effect');
      }
      this.viewerControls.showInfo = !this.viewerControls.showInfo;
      this.updateAnnotationVisibility();
    },
    toggleMeshCursor($event) {
      if(this.isRecordingVideo || this.isEncodingVideo) return;
      if (this.isEditMenuOpen || this.isAnnotationEditMenuOpen) {
        showToast({ type: 'warning', message: '编辑模式下无法切换飞行/轨道' });
        return;
      }
      this.hideOtherFeatureBubbles(null);
      this.viewerControls.isOrbitMode = !this.viewerControls.isOrbitMode;
      this.cameraControls.mode = this.viewerControls.isOrbitMode ? 'orbit' : 'fly';
      if (!this.viewerControls.isOrbitMode) {
        this.stopLoopPlayback(false);
      }
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
    // 设置初始化位置：保存当前相机位置，focus保持不变
    setInitialCameraPosition() {
      if (!this.skullEntity || !this.cameraControls || !this.cameraEntity) return;

      // 获取当前焦点位置（如果已有initialCameraPose则使用，否则计算）
      let focusPoint;
      if (this.initialCameraPose?.focus) {
        focusPoint = new pc.Vec3(
          this.initialCameraPose.focus.x,
          this.initialCameraPose.focus.y,
          this.initialCameraPose.focus.z
        );
      } else {
        // 计算模型中心作为focus
        const center = this.getModelCenter();
        if (!center) return;
        focusPoint = center;
      }

      // 获取当前相机位置
      const cameraPos = this.cameraEntity.getPosition().clone();

      // 更新initialCameraPose
      this.initialCameraPose = {
        cameraPosition: {
          x: cameraPos.x,
          y: cameraPos.y,
          z: cameraPos.z
        },
        focus: {
          x: focusPoint.x,
          y: focusPoint.y,
          z: focusPoint.z
        }
      };

      // 静默保存到服务器
      this.saveSettings(false);
      // 显示边框闪一下效果
      this.showSnapshotFlash = true;
      setTimeout(() => {
        this.showSnapshotFlash = false;
      }, 200);
      showToast({ type: 'success', message: '初始化位置已保存' });
    },
    toggleSettingsMenu($event = null) {
      if(this.isRecordingVideo || this.isEncodingVideo) return;
      if (!this.isSettingsMenuOpen) {
        this.hideOtherFeatureBubbles('settings');
        this.snapshotSettings(); // 打开设置面板时保存快照
      }
      this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
    },
    snapshotSettings() {
      this.originalSettings = {
        orbitMotionType: this.orbitMotionType,
        moveSpeed: this.viewerControls.moveSpeed,
        orbitSpeed: this.viewerControls.orbitSpeed,
        autoRotateSpeed: this.viewerControls.autoRotateSpeed,
        pinchSpeed: this.viewerControls.pinchSpeed,
        backgroundColor: this.viewerControls.backgroundColor
      };
    },
    hasSettingsChanged() {
      if (!this.originalSettings) return false;
      const orig = this.originalSettings;
      const curr = {
        orbitMotionType: this.orbitMotionType,
        moveSpeed: this.viewerControls.moveSpeed,
        orbitSpeed: this.viewerControls.orbitSpeed,
        autoRotateSpeed: this.viewerControls.autoRotateSpeed,
        pinchSpeed: this.viewerControls.pinchSpeed,
        backgroundColor: this.viewerControls.backgroundColor
      };
      return orig.orbitMotionType !== curr.orbitMotionType ||
        orig.moveSpeed !== curr.moveSpeed ||
        orig.orbitSpeed !== curr.orbitSpeed ||
        orig.autoRotateSpeed !== curr.autoRotateSpeed ||
        orig.pinchSpeed !== curr.pinchSpeed ||
        orig.backgroundColor !== curr.backgroundColor;
    },
    restoreSettings() {
      if (!this.originalSettings) return;
      const orig = this.originalSettings;
      this.orbitMotionType = orig.orbitMotionType;
      this.viewerControls.moveSpeed = orig.moveSpeed;
      this.viewerControls.orbitSpeed = orig.orbitSpeed;
      this.viewerControls.autoRotateSpeed = orig.autoRotateSpeed;
      this.viewerControls.pinchSpeed = orig.pinchSpeed;
      this.viewerControls.backgroundColor = orig.backgroundColor;
      this.updateCameraControls();
    },
    handleBeforeUnload(e) {
      if (this.hasSettingsChanged() || this.hasAnnotationChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    async saveSettings(show = true) {
      try {
        const settings = {
          moveSpeed: this.viewerControls.moveSpeed,
          orbitSpeed: this.viewerControls.orbitSpeed,
          autoRotateSpeed: this.viewerControls.autoRotateSpeed,
          pinchSpeed: this.viewerControls.pinchSpeed,
          backgroundColor: this.viewerControls.backgroundColor,
          orbitMotionType: this.orbitMotionType,
          motionData: this.customMotion ? {
            keyframes: this.customMotion.keyframes || [],
            interpolationType: this.customMotion.interpolationType || 'easeInOut',
            closedLoop: this.customMotion.closedLoop ?? true
          } : null,
          initialCameraPose: this.initialCameraPose,
        };
        await ApiServer.request({
          method: 'post',
          url: API.SAVE_MODEL_SETTING,
          data: {
            task_id: this.task_id,
            setting: settings
          }
        });
        this.originalSettings = {
          orbitMotionType: this.orbitMotionType,
          moveSpeed: this.viewerControls.moveSpeed,
          orbitSpeed: this.viewerControls.orbitSpeed,
          autoRotateSpeed: this.viewerControls.autoRotateSpeed,
          pinchSpeed: this.viewerControls.pinchSpeed,
          backgroundColor: this.viewerControls.backgroundColor
        };
        if(show)
          showToast('设置保存成功');
      } catch (error) {
        console.error('保存设置失败：', error);
        if(show)
          showToast('设置保存失败');
      }
    },
    async loadSettings() {
      try {
        const response = await ApiServer.request({
          method: 'get',
          url: `${API.GET_MODEL_SETTING}/${this.task_id}`
        });
        const settings = response.data.data;
        console.log('已经保存的设定', settings)
        if (settings) {
          // 使用服务器返回的设置，如果某个字段不存在则使用默认值
          this.viewerControls.moveSpeed = settings.moveSpeed ?? DEFAULT_SETTINGS.moveSpeed;
          this.viewerControls.orbitSpeed = settings.orbitSpeed ?? DEFAULT_SETTINGS.orbitSpeed;
          this.viewerControls.autoRotateSpeed = settings.autoRotateSpeed ?? DEFAULT_SETTINGS.autoRotateSpeed;
          this.viewerControls.pinchSpeed = settings.pinchSpeed ?? DEFAULT_SETTINGS.pinchSpeed;
          this.viewerControls.backgroundColor = settings.backgroundColor ?? DEFAULT_SETTINGS.backgroundColor;
          if (settings.orbitMotionType !== undefined) this.orbitMotionType = settings.orbitMotionType;
          if (settings.motionData) {
            this.customMotion = settings.motionData;
          }
          if(settings.initialCameraPose !== undefined)
          {
            this.initialCameraPose = settings.initialCameraPose;
          }
          this.updateCameraControls();
        }
        this.originalSettings = settings
      } catch (error) {
        console.log('获取设置失败或无设置：', error);
      }
    },
    adjustValue(key, step) {
      switch(key) {
        case 'moveSpeed':
          this.viewerControls.moveSpeed = this.clamp(this.viewerControls.moveSpeed + step, 0.1, 5);
          this.cameraControls.moveSpeed = this.viewerControls.moveSpeed;
          break;
        case 'orbitSpeed':
          this.viewerControls.orbitSpeed = this.clamp(this.viewerControls.orbitSpeed + step, 1, 30);
          this.cameraControls.orbitSpeed = this.viewerControls.orbitSpeed;
          break;
        case 'pinchSpeed':
          this.viewerControls.pinchSpeed = this.clamp(this.viewerControls.pinchSpeed + step, 0.1, 2);
          this.cameraControls.pinchSpeed = this.viewerControls.pinchSpeed;
          break;
        case 'originalFov':
          this.viewerControls.originalFov = this.clamp(this.viewerControls.originalFov + step, 30, 150);
          if(this.cameraEntity && this.cameraEntity.camera) {
            this.cameraEntity.camera.fov = this.viewerControls.originalFov;
          }
          break;
      }
    },
    resetAllSettings() {
      const {showInfo, isOrbitMode} = this.viewerControls
      this.viewerControls = { ...DEFAULT_SETTINGS, showInfo, isOrbitMode };
      this.updateCameraControls();
    },
    destroyPreViewer() {
      this.clearLoopPlayStartTimer();
      this.clearAutoLoopPlayTimer();
      this.clearControlsHideTimer();
      this.isLoopPlaying = false;
      message.destroy(this.sogConvertMessageKey);
      this.sogConvertProgressText = '';
      // 销毁时停止录制和编码
      this.stopVideoRecord();
      this.resetVideoState();
      if (this.skullEntity && this.app) {
        this.app.root.removeChild(this.skullEntity);
        this.skullEntity.destroy();
        this.skullEntity = null;
      }
      if (this.app) {
        this.app.off('annotation:click', this.onAnnotationClick);
        this.app.off('annotation:remove', this.onAnnotationRemove);
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
      // 销毁FFmpeg实例
      if (this.ffmpeg) {
        this.ffmpeg = null;
      }
    },
    receiveFlutterMsg(type, msg) {
      if(type === "uploadError" || type == "downloadError" || type === "videoPickerError" || type === "fileTypeError") {
        this.$emit('loadingFail', 'fail');
        showToast({ type: 'error', message: msg });
      } else if(type === "filePickerCancelled") {
        this.isViewerLoading = false;
      }
    },

    // ========== 新增：视频特效选择对话框相关方法 ==========
    // 打开视频特效选择对话框
    async openVideoEffectDialog() {
      if (this.isAnnotationEditMenuOpen) {
        this.requestExitAnnotationEditMode('openVideoEffect');
        return;
      }

      if (this.showVideoEffectDialog) {
        this.closeVideoEffectDialog();
        return;
      }
      
      this.hideOtherFeatureBubbles('video');
      this.stopLoopPlayback(false);
      this.showVideoEffectDialog = true;
      this.updateAnnotationVisibility();
      // 重置选中的特效为无特效（默认）
      this.selectedVideoEffect = -1;
      try{
        const res = await window.flutter_inappwebview.callHandler(
          "FlutterSaveVideoChannel",
        );
        if(!res)
          this.closeVideoEffectDialog();
      }catch(e)
      {
        console.log(e)
      }
    },
    // 关闭视频特效选择对话框
    closeVideoEffectDialog() {
      this.showVideoEffectDialog = false;
      this.updateAnnotationVisibility();
    },
    // 确认生成视频（对话框确认按钮回调）
    async confirmVideoGenerate() {
      // 开始视频生成
      this.generateRotateVideo();
    },

    // ========== FFmpeg相关方法（少量修改，移除无用的event参数） ==========
    async initFFmpeg() {
      try {
        const parseFfmpegProgress = ({ message }) => {
          // 匹配FFmpeg转码的进度行（格式：frame=  120 fps= 30 q=29.0 Lsize=     123kB time=00:00:04.00 bitrate= 249.8kbits/s speed=1.0x）
          const progressReg = /frame=\s*(\d+).*time=\s*(\d+:\d+:\d+\.\d+).*speed=\s*(\d+\.?\d*)x/;
          const match = message.match(progressReg);
          if (!match) return -1; // 非进度行，返回-1

          this.encodeProgress =  Number.parseFloat((parseInt(match[1]) / this.videoFrameList.length * 100).toFixed(2)); 
        };

        this.ffmpeg = createFFmpeg({
          log: false, // 开启日志，方便调试
          corePath: '/ffmpeg-core.js', // FFmpeg核心文件路径（public目录）
          wasmPath: '/ffmpeg-core.wasm', // FFmpeg wasm文件路径（public目录）
        });
        this.ffmpeg.setLogger(parseFfmpegProgress)
        // 加载FFmpeg核心（必须等待加载完成才能使用）
        if (!this.ffmpeg.isLoaded()) {
          await this.ffmpeg.load();
        }
        console.log('FFmpeg.wasm 初始化成功');
      } catch (error) {
        console.error('FFmpeg初始化失败：', error);
        // showToast({ type: 'error', message: `FFmpeg初始化失败：${error.message}，无法生成MP4` });
      }
    },

    /**
     * 旋转模型并捕获当前帧（每帧执行，核心：canvas.toDataURL捕获）
     */
    updateModelRotateAndCaptureFrame() {
      
      if (this.currentRotateAngle >= this.targetRotateAngle) {
        // 旋转完成，停止捕获帧，开始FFmpeg编码MP4
        this.stopVideoRecord(); 
        this.encodeVideoToMP4();
        return;
      }
      this.videoRecordProgress = (this.currentRotateAngle / this.targetRotateAngle) * 100;
      try {
        const frameBase64 = this.canvas.toDataURL('image/jpeg', 0.95);
        this.videoFrameList.push(frameBase64);
      } catch (error) {
        console.error('捕获帧失败：', error);
        this.stopVideoRecord();
        this.resetVideoState();
        showToast({ type: 'error', message: `帧捕获失败：${error.message}` });
      }
    },

    sendFramesToFlutter() {
      const total = this.videoFrameList.length;

      window.flutter_inappwebview.callHandler(
        "onVideoFramesStart",
        {
          total,
          fps: this.videoFps,
          width: this.canvas.width,
          height: this.canvas.height,
          effect: this.selectedVideoEffect
        }
      );

      this.videoFrameList.forEach((frame, index) => {
        window.flutter_inappwebview.callHandler(
          "onVideoFrame",
          {
            index,
            data: frame.replace(/^data:image\/jpeg;base64,/, '')
          }
        );
      });

      window.flutter_inappwebview.callHandler("onVideoFramesEnd");
    },

    /**
     * 重置视频录制/编码状态
     */
    resetVideoState() {
      this.isRecordingVideo = false;
      this.isEncodingVideo = false;
      this.videoRecordProgress = 0;
      this.encodeProgress = 0;
      this.currentRotateAngle = 0;
      this.targetRotateAngle = 360; // 重置为目标角度
      this.videoFrameList = [];
      this.generatedVideoBlob = null;
      // 重置模型角度
      // if (this.skullEntity) {
      //   this.skullEntity.setLocalEulerAngles(180, 0, 0);
      // }
      this.updateAnnotationVisibility();
    },

    /**
     * FFmpeg编码帧为MP4（核心：将base64帧转为视频，h264编码）
     */
    async encodeVideoToMP4() {
      if (!this.ffmpeg || this.videoFrameList.length === 0) {
        showToast({ type: 'error', message: '无帧数据或FFmpeg未初始化，无法编码' });
        this.resetVideoState();
        return;
      }
      try {
        this.isEncodingVideo = true;
        showToast({ type: 'info', message: '开始生成MP4视频，请勿关闭页面' });
        const ffmpeg = this.ffmpeg;
        // 写入所有帧到虚拟文件系统
        for (let i = 4; i < this.videoFrameList.length; i++) {
          const frameBase64 = this.videoFrameList[i].replace(/^data:image\/jpeg;base64,/, '');
          const frameBuffer = Uint8Array.from(atob(frameBase64), c => c.charCodeAt(0));
          // 帧文件名补零，保证FFmpeg按顺序读取（关键：必须补零）
          const frameName = `frame_${String(i + 1).padStart(4, '0')}.jpg`;
          ffmpeg.FS('writeFile', `/${frameName}`, frameBuffer);
        }

        // 执行FFmpeg转码命令`  
        await ffmpeg.run(
          '-start_number', '5', // 从第5帧开始，跳过前4帧
          '-r', this.videoFps.toString(),
          '-f', 'image2',
          '-i', '/frame_%04d.jpg',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-y', // 强制覆盖输出文件
          '/output.mp4'
        );
        // 读取转码后的MP4文件
        const mp4Data = ffmpeg.FS('readFile', '/output.mp4');
        this.generatedVideoBlob = new Blob([mp4Data], { type: 'video/mp4' });
        this.clearLoopPlayStartTimer();
        this.isLoopPlaying = false;
        // 编码完成
        this.isEncodingVideo = false;
        showToast({ type: 'success', message: 'MP4视频生成完成' });
        this.saveGeneratedVideo();
      } catch (error) {
        console.error('FFmpeg编码MP4失败：', error);
        showToast({ type: 'error', message: `MP4生成失败：${error.message}` });
        this.isEncodingVideo = false;
        this.resetVideoState();
      }
    },

    /**
     * 保存生成的MP4视频（浏览器下载/Flutter通信）
     */
    saveGeneratedVideo() {
      this.showVideoSuccessModal = false;
      if (!this.generatedVideoBlob) {
        showToast({ type: 'error', message: '无可用MP4视频文件' });
        return;
      }
      try {
        // 浏览器自动下载
        const videoUrl = URL.createObjectURL(this.generatedVideoBlob);
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `model_rotate_${new Date().getTime()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(videoUrl);
        // 如需传给Flutter，取消下面注释
        // const blobToBase64 = (blob) => {
        //   return new Promise((resolve) => {
        //     const reader = new FileReader();
        //     reader.onloadend = () => resolve(reader.result.split(',')[1]);
        //     reader.readAsDataURL(blob);
        //   });
        // };
        // blobToBase64(this.generatedVideoBlob).then((videoBase64) => {
        //   let format;
        //   switch(this.selectedVideoEffect)
        //   {
        //     case 0:
        //       format = "";
        //       break;
        //     case 1:
        //       format = "radial";
        //       break;
        //     case 2:
        //       format = "rain";
        //       break;
        //     case 3:
        //       format = "grid";
        //       break;
        //   }
        //   window.flutter_inappwebview.callHandler(
        //     "FlutterSaveVideoChannel",
        //     videoBase64,
        //     format,
        //   );
        // });
        // showToast({ type: 'success', message: 'MP4视频保存成功' });
        // 保存后重置状态
        this.resetVideoState();
      } catch (error) {
        console.error('保存MP4视频失败：', error);
        // showToast({ type: 'error', message: `视频保存失败：${error.message}` });
      }
    },

    /**
     * 生成旋转视频主入口（移除event参数，简化逻辑）
     */
    async generateRotateVideo() {
      // 校验模型
      if (!this.skullEntity) {
        showToast({ type: 'warning', message: '模型未加载，无法生成视频' });
        return;
      }
      // 开始录制（捕获帧）
      await this.startVideoRecord();
    },

    /**
     * 开始帧捕获（移除event参数，简化逻辑）
     */
    async startVideoRecord() {
      try{
        const userStartRecord = await window.flutter_inappwebview.callHandler(
          "FlutterCheckVideoFileChannel",
          this.selectedVideoEffect,
        );
        if(!userStartRecord)
          return;
      }catch(e)
      {
        console.log(e)
      }

      // 初始化播放状态
      if (this.orbitMotionType === 'custom' && this.customMotion) {
        // 自定义运镜模式：初始化时间相关的状态
        const inited = this.initLoopPlaybackState();
        if (inited) {
          this.currentRotateAngle = 0;
          this.orbitPlaybackAngle = 0;
          // 设置目标为自定义运镜的总时长
          this.targetRotateAngle = this.customMotionTotalDuration;
          this.applyCustomMotionAtTime(0);
        } else {
          this.resetCamera();
        }
      } else {
        // 其他运镜模式：初始化角度相关的状态
        const inited = this.initLoopPlaybackState();
        if (inited) {
          this.orbitPlaybackSessionStartAngle = 0;
          this.orbitPlaybackTravelled = 0;
          this.orbitPlaybackAngle = 0;
          this.currentRotateAngle = 0;
          this.targetRotateAngle = 360;
          this.applyOrbitAngle(0, false);
        } else {
          this.resetCamera();
        }
      }

      // 先重置视频状态（在设置目标角度之前）
      this.resetVideoState();
      // 重置完状态后，重新设置目标角度
      if (this.orbitMotionType === 'custom' && this.customMotion) {
        this.targetRotateAngle = this.customMotionTotalDuration;
      } else {
        this.targetRotateAngle = 360;
      }
      // 重置所有视频状态
      this.showVideoEffectDialog = false;
      this.updateAnnotationVisibility();
      // 根据选中的特效处理：无特效则移除所有，有特效则添加对应特效
      if (this.selectedVideoEffect === -1) {
        // 无特效：移除所有已添加的特效
        removeAllEffects?.(this.skullEntity);
      } else {
        // 有特效：添加选中的特效
        this.createEffect(this.selectedVideoEffect);
      }
      // this.isLoopPlaying = false;
      // 开始捕获帧
      this.isRecordingVideo = true;
      this.updateAnnotationVisibility();
      this.app.on('postrender', this.updateModelRotateAndCaptureFrame, this);
    },
        /**
     * 停止帧捕获
     */
    stopVideoRecord() {
      this.isRecordingVideo = false;
      this.cameraControls.autoRotateSpeed = 30;
      this.app.off('postrender', this.updateModelRotateAndCaptureFrame, this);
      this.updateAnnotationVisibility();
      
    },
    // ========== FFmpeg相关方法结束 ==========
    quatRotateVector(q) {
      const [qx, qy, qz, qw] = q;
      const [vx, vy, vz] = [0,0,-1]; 

      // 四元数旋转向量的数学公式
      const x = vx * (1 - 2*qy*qy - 2*qz*qz) + vy * (2*qx*qy - 2*qz*qw) + vz * (2*qx*qz + 2*qy*qw);
      const y = vx * (2*qx*qy + 2*qz*qw) + vy * (1 - 2*qx*qx - 2*qz*qz) + vz * (2*qy*qz - 2*qx*qw);
      const z = vx * (2*qx*qz - 2*qy*qw) + vy * (2*qy*qz + 2*qx*qw) + vz * (1 - 2*qx*qx - 2*qy*qy);

      return new pc.Vec3([x, y, z]);
    },
    cameraDataToVector(cameraData){
      if(cameraData?.length > 0)
        return this.quatRotateVector(cameraData[0]?.quaternion);
      else 
        return null
    },
    async getCameraData(){
        try {
          const response = await ApiServer.request({
            method: 'get',
            url: API.GET_CAMERA_DATA,
            params:{
              task_id: this.task_id
            }
          });
          const cameraData = response.data.data;
          this.cameraData = cameraData;
          // console.log("【vue信息】相机数据：", cameraData);
        } catch (error) {
          console.error('获取相机数据失败：', error);
        }
    }
  },
  async mounted() {
      const canvas = document.getElementById('application-canvas');
    if (canvas) {
      canvas.addEventListener('keydown', handleEscKey);
    }
    // 检测设备类型
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.addEventListener('fullscreenchange', this.syncFullscreenState);
    await this.initViewer();
    await this.getCameraData();
    await this.getTargetModel();
    // 加载设置
    await this.loadSettings();

    // 加载自定义运镜参数
    if (this.$route.query.customMotion) {
      try {
        this.customMotion = JSON.parse(this.$route.query.customMotion);
        this.orbitMotionType = 'custom';
        this.loopPlay = this.customMotion?.loopPlay !== false;
        console.log('加载自定义运镜参数:', this.customMotion);
      } catch (e) {
        console.error('解析自定义运镜参数失败:', e);
        this.customMotion = null;
      }
    }

    // 动态计算右侧面板偏移量
    this.$nextTick(() => {
      const rightBtnGroup = document.querySelector('.right-center-controls');
      if (rightBtnGroup) {
        const btnWidth = rightBtnGroup.getBoundingClientRect().width;
        const offset = btnWidth + 30; // 按钮宽度 + 12px 右边距
        console.log("offset:", offset);
        document.documentElement.style.setProperty('--panel-right-offset', `${offset}px`);
      }
    });

    // const loadLocalModel = async () => {
    //   try {
    //     const localFilePath = 'test3.sog';
    //     const fileName = localFilePath.substring(localFilePath.lastIndexOf('/') + 1);
    //     const response = await fetch(localFilePath);
    //     if (!response.ok) {
    //       throw new Error(`请求本地文件失败：${response.status} ${response.statusText}`);
    //     }
    //     const arrayBuffer = await response.arrayBuffer();
    //     this.isViewerLoading = true;
    //     this.loading_status = '';
    //     this.renderFromArrayBuffer(fileName, arrayBuffer);
    //     console.log(`本地文件 ${fileName} 导入成功，开始渲染模型`);
    //   } catch (error) {
    //     this.isViewerLoading = false;
    //     this.loading_status = 'fail';
    //     console.error('本地文件导入失败：', error);
    //   }
    // };
    // await loadLocalModel();

    // 监听浏览器关闭/刷新事件
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.receiveFlutterMsg = null;
    document.removeEventListener('fullscreenchange', this.syncFullscreenState);
    this.destroyPreViewer();
    const canvas = document.getElementById('application-canvas');
    if (canvas) {
      canvas.removeEventListener('keydown', handleEscKey);
    }
  },
}
</script>

<style scoped>
/* 新增：视频特效选择对话框样式（核心美观样式） */
:deep(.video-effect-dialog) {
  max-width: 400px;
  border-radius: 16px;
  overflow: hidden;
}
:deep(.video-effect-dialog .van-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #f5f5f5;
}
:deep(.video-effect-dialog .van-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}
:deep(.video-effect-dialog .van-dialog__content) {
  padding: 20px 24px;
}
:deep(.video-effect-dialog .van-dialog__footer) {
  padding: 0 24px 20px;
  display: flex;
  gap: 12px;
}
:deep(.video-effect-dialog .ant-btn) {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 16px;
}
:deep(.video-effect-dialog .ant-btn-default) {
  background: #f5f5f5;
  color: #1d1d1f;
}
:deep(.video-effect-dialog .ant-btn-primary) {
  background: #1d1d1f;
  color: #fff;
  border: none;
}
.video-effect-selector .selector-title {

  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin: 0 0 16px 0;
  padding: 10px;
}
.video-effect-selector .effect-option:hover {
  background: #fafafa;
  transform: translateY(-2px);
}
.video-effect-selector .effect-icon {
  width: 84px;
  height: 84px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
.video-effect-selector .no-effect-icon {
  color: #1d1d1f;
}
.video-effect-selector .effect-name {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
}
.video-effect-selector .tips-text {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

/* 原有样式完全保留，无修改 */
.custom-close-btn {
  margin-top: 10px;
  position: fixed;
  right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999; /* 确保在最上层 */
  cursor: pointer;
}

.effect-scroll-container {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  max-height: calc(100vh - 320px);
  max-width: 980px;
  margin: 0 auto;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  padding: 4px;
}

.effect-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  gap: 4px;
  border: 1px solid #ececec;
  background: #fff;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.effect-card:hover {
  border-color: #bdbdbd;
  transform: translateY(-1px);
}

.effect-card-thumb {
  width: 100%;
  height: 62px;
  object-fit: cover;
  border-radius: 8px;
}

.effect-card-title {
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 600;
}

.effect-card-desc {
  position: static;
  color: #8c8c8c;
  font-size: 12px;
}

.orbit-player {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.orbit-progress-wrap {
  width: 260px;
}

.orbit-progress-wrap :deep(.ant-slider) {
  margin: 0;
}

:deep(.effect-cell .ant-image-img) {
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
}

.loop-play-button {
  position: static;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #1d1d1f;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.7),
    inset 0 -1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  z-index: 998;
  font-size: 20px;
}
.loop-play-button:active {
  transform: scale(0.90);
}
.rotating {
  animation: rotate 2s linear infinite;
}
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.setting-slider-control{
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  width: 25vh;
}

.edit-popup {
  padding: 0;
  box-sizing: border-box;
  background-color: #ffffff;
}
.edit-modal-content {
  padding: 24px 20px;
  box-sizing: border-box;
  overflow-y: auto;
}
.axis-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.axis-panel {
  border: 1px solid #efefef;
  border-radius: 12px;
  background: #fff;
  padding: 10px;
}
.axis-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.axis-panel-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f4f5f7;
  color: #1d1d1f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
.axis-panel-title {
  font-size: 13px;
  color: #1d1d1f;
  font-weight: 600;
}
.axis-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.axis-slider-row + .axis-slider-row {
  margin-top: 8px;
}
.axis-side-btn {
  min-width: 46px;
  padding: 0 8px;
}
.axis-slider-row .param-slider {
  flex: 1;
  min-width: 120px;
  margin: 0;
}
.axis-row-value {
  min-width: 42px;
  text-align: right;
  font-size: 12px;
  color: #5f6368;
}
.axis-select-group {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  justify-content: center;
  flex-wrap: wrap;
}
.axis-select-btn {
  flex: 0 0 auto;
  padding: 6px 12px;
  font-size: 14px;
}
.single-slider-wrap {
  width: 80%;
  display: flex;
  gap: 16px;
  align-items: center;
}
.axis-value-display {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
  padding: 4px 8px;
  background-color: #f7f8fa;
  border-radius: 4px;
}
.edit-modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  box-sizing: border-box;
  justify-content: center;
}
.edit-modal-footer .save-btn,
.edit-modal-footer .cover-btn {
  flex: 1;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}
.save-btn {
  flex: 1;
  padding: 14px 0;
  background: #2a2a2a;
  color: #ffffff;
  border: 1px solid #444;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.save-btn:hover {
  background: #333;
}
.cover-btn {
  flex: 1;
  padding: 14px 0;
  background: #333;
  color: #ffffff;
  border: 1px solid #555;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.cover-btn:hover {
  background: #444;
}
.save-btn:active, .cover-btn:active {
  transform: translateY(0);
}

.settings-menu-inner {
  background: #ffffff;
  color: #1d1d1f;
}
.settings-menu-inner .menu-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.settings-menu-inner .setting-item {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.settings-menu-inner .setting-label {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
}
.settings-menu-inner .setting-slider-control {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  width: 180px;
  gap: 10px;
}
.settings-menu-inner .setting-slider-control .param-slider {
  flex: 1;
  min-width: 130px;
}
.single-slider-wrap .param-slider {
  flex: 1;
  min-width: 180px;
}
.settings-menu-inner .setting-color-control {
  display: flex;
  align-items: center;
  gap: 12px;
}
.settings-menu-inner .color-picker {
  width: 44px;
  height: 44px;
  border: none;
  padding: 0;
  background: transparent;
}
.settings-menu-inner .color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.settings-menu-inner .color-picker::-webkit-color-swatch {
  border-radius: 10px;
  border: 2px solid #1d1d1f;
}
:deep(.param-slider .ant-slider-rail) {
  background-color: #f0f0f0;
}
:deep(.param-slider .ant-slider-track) {
  background: #1d1d1f;
}
:deep(.param-slider .ant-slider-handle::after) {
  width: 14px;
  height: 14px;
  background: #ffffff;
  border: 2px solid #1d1d1f;
  box-shadow: 0 0 8px rgba(29, 29, 31, 0.2);
  transition: all 0.2s ease;
}
:deep(.param-slider .ant-slider-handle:hover::after) {
  transform: scale(1.08);
  box-shadow: 0 0 12px rgba(29, 29, 31, 0.3);
}
.settings-menu-inner .setting-value {
  font-size: 14px;
  color: #1d1d1f;
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}
.settings-menu-inner .menu-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.settings-menu-inner .reset-btn {
  width: 100%;
  padding: 10px 0;
  background-color: #000000;
  color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.success-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  justify-content: center;
}
.success-icon {
  font-size: 1rem;
  color: #67c23a;
}
.success-text {
  color: #222121;
  font-size: 1rem;
  margin: 0;
}

.nav-left {
  position: fixed;
  top:10px;
  left: 10px;
  z-index: 11;
}
.back-btn {
  width: 44px;
  height: 44px;
  color: #ffffff;
  transition: all 0.2s ease;
}
.render-task-container {
  --drawer-max-width: 100px;
  --control-btn-size: 44px;
  --control-bar-gap: 16px;
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

/* 返回按钮 */
.back-button {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-2px);
}

.back-button:active {
  transform: translateX(0) scale(0.95);
}

.core-content{
  flex: 1;
  position: relative;
  overflow: hidden;
}
.viewer-container {
  width: 100%;
  height: 100%;
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
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
  will-change: width, height;
  pointer-events: auto;
}

#application-canvas {
  width: 100vw !important;
  height: 100vh !important;
  object-fit: cover;
  pointer-events: auto;
  z-index: 998;
  will-change: transform;
  backface-visibility: hidden;
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
.loading-spinner::before,
.loading-spinner::after {
  content: none !important;
}
.loading-spinner.success {
  color: #67c23a;
  font-size: 60px;
  width: 1em;
  height: 1em;
  animation: none;
  position: relative;
}
.loading-spinner.success::before {
  content: '' !important;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 12px;
  border-radius: 2px;
  background: transparent;
  transform: translate(-50%, -50%) rotate(-45deg);
  box-shadow: none;
  border: none;
  border-left: 3px solid #67c23a;
  border-bottom: 3px solid #67c23a;
}
.loading-spinner.success::after {
  content: '' !important;
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #67c23a;
  opacity: 1;
}
.loading-spinner.fail {
  color: #f56c6c;
  animation: mltShdSpin 1.7s infinite ease, round 1.7s infinite ease, shake 0.5s ease-in-out;
}
@keyframes mltShdSpin {
  0% {
    box-shadow: 0 -0.83em 0 -0.4em,
    0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em,
    0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
  5%,
  95% {
    box-shadow: 0 -0.83em 0 -0.4em, 
    0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 
    0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
  10%,
  59% {
    box-shadow: 0 -0.83em 0 -0.4em, 
    -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, 
    -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em;
  }
  20% {
    box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em,
     -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, 
     -0.749em -0.34em 0 -0.477em;
  }
  38% {
    box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em,
     -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, 
     -0.82em -0.09em 0 -0.477em;
  }
  100% {
    box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 
    0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;
  }
}
@keyframes round {
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
}
@keyframes shake {
  0%, 100% { transform: rotateX(70deg) rotateZ(0deg); }
  25% { transform: rotateX(70deg) rotateZ(-10deg); }
  75% { transform: rotateX(70deg) rotateZ(10deg); }
}
@keyframes successPulse {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
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

.feature-control-bar {
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.feature-control-item {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.feature-popover-stack {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 1003;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-bubble {
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
  padding: 12px;
  max-height: min(70vh, 560px);
  overflow: auto;
}

.bubble-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.bubble-actions .ant-btn {
  flex: 1;
  min-width: 92px;
}

.edit-actions {
  flex-wrap: wrap;
}

.effect-bubble {
  width: min(80vw, 340px);
}

.settings-bubble,
.edit-bubble,
.video-bubble {
  width: min(80vw, 420px);
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

.primary-action-btn,
.feature-btn {
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.86);
  color: #1d1d1f;
  font-weight: 500;
  transition: all 0.22s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.primary-action-btn {
  min-width: 92px;
}

.feature-btn {
  min-width: 92px;
}

.control-btn-item .ant-btn:active,
.feature-control-item .ant-btn:active {
  transform: scale(0.95);
}
.control-btn-item .ant-btn:hover,
.feature-control-item .ant-btn:hover {
  transform: translateY(-2px);
}
.control-btn-item .ant-btn-primary,
.feature-control-item .ant-btn-primary {
  background: #1d1d1f;
  color: #fff;
  border: none;
}

:deep(.drawer-card .ant-drawer-content-wrapper) {
  width: min(80vw, 420px) !important;
  left: auto !important;
  right: 0 !important;
  transform: none !important;
}

:deep(.drawer-card .ant-drawer-content) {
  border-radius: 18px 0 0 18px;
  box-shadow: -12px 0 32px rgba(13, 18, 28, 0.24);
  overflow: hidden;
}

:deep(.drawer-card .ant-drawer-header),
:deep(.drawer-card .ant-drawer-body) {
  width: 80%;
  margin: 0 auto;
  padding-left: 0;
  padding-right: 0;
  box-sizing: border-box;
}

:deep(.drawer-card .ant-drawer-header) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.drawer-card .ant-drawer-title) {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

:deep(.drawer-card .ant-drawer-close) {
  color: #1d1d1f;
}

.video-effect-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: calc(100vh - 360px);
}

.video-effect-selector .effect-option {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #ececec;
  background: #fff;
  cursor: pointer;
}

.video-effect-selector .effect-option.active {
  border-color: #1d1d1f;
}

.video-effect-selector .effect-icon {
  width: 100%;
  height: 62px;
  border-radius: 8px;
  overflow: hidden;
}

.video-effect-selector .effect-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.video-effect-selector .effect-desc {
  font-size: 12px;
  color: #8c8c8c;
}

.video-effect-selector .tips-text {
  margin: 10px 0;
}

.annotation-dialog {
  padding: 0;
  width: 90vw;
  max-width: 420px;
  border-radius: 16px;
}
.annotation-dialog-inner {
  background: #fff;
  padding: 16px 16px 12px;
  border-radius: 16px;
}
.annotation-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.annotation-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}
.annotation-dialog-body {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.annotation-view-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.annotation-view-item .label {
  font-size: 12px;
  color: #8c8c8c;
}
.annotation-view-item .value {
  font-size: 14px;
  color: #1d1d1f;
  word-break: break-word;
}
.annotation-dialog-footer {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.annotation-exit-footer {
  display: flex;
  gap: 12px;
  padding: 12px 16px 16px;
}

.annotation-exit-footer .ant-btn {
  flex: 1;
}

.bottom-sheet {
  position: fixed;
  left: 0;
  bottom: -20px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-height: 40px;
  max-height: 70vh;
  overflow: hidden;
  transition: 
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.3s ease,
    border-color 0.3s ease;
  will-change: transform;
}
.bottom-sheet.expanded {
  background-color: rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 -6px 25px rgba(0, 0, 0, 0.15);
}
.sheet-drag-handle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 10px 0;
  cursor: grab;
  color: white;
  transition: color 0.3s ease;
}
.bottom-sheet.expanded .sheet-drag-handle {
  color: black;
}
.drag-bar {
  width: 40px;
  height: 6px;
  background-color: rgba(252, 252, 252, 1);
  border-radius: 3px;
  transition: 
    background-color 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.3s ease;
}
.bottom-sheet.expanded .drag-bar {
  background-color: rgba(0, 0, 0, 1);
  transform: scaleX(1.2);
}
.sheet-drag-handle:active .drag-bar {
  transform: scaleX(1.3);
}
.sheet-drag-handle .anticon {
  transition: 
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    color 0.3s ease;
}
.sheet-drag-handle .anticon.rotate {
  transform: rotate(180deg);
  color: black;
}
.sheet-content {
  max-height: 70vh;
  overflow-y: auto;
  transition: 
    opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  color: rgba(0, 0, 0, 0.8);
  display: none;
}
.bottom-sheet.dragging .sheet-content,
.bottom-sheet.expanded .sheet-content {
  opacity: 1;
  transform: translateY(0);
  color: rgba(0, 0, 0, 0.9);
}
@media (max-width: 768px) {
  :deep(.drawer-card .ant-drawer-content-wrapper) {
    width: 100vw !important;
    left: 0 !important;
    right: auto !important;
    transform: none !important;
  }

  :deep(.drawer-card .ant-drawer-content) {
    border-radius: 0;
  }

  .bottom-control-bar {
    right: 12px;
    bottom: 12px;
  }

  .feature-control-bar {
    right: 12px;
    top: auto;
    bottom: 90px;
    transform: none;
  }

  .feature-bubble {
    max-height: 58vh;
  }

  .feature-popover-stack {
    right: calc(100% + 8px);
  }

  .orbit-player {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
  }

  .orbit-progress-wrap {
    width: 100%;
  }
  .control-btn-item .ant-btn {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
  .effect-cell-label {
    font-size: 12px;
  }

  .effect-grid,
  .video-effect-grid {
    grid-template-columns: 1fr;
  }
  .bottom-sheet.expanded {
    max-height: 80vh;
  }
  .sheet-content {
    max-height: calc(80vh - 40px);
  }
}
@media (min-width: 1024px) {
  .bottom-control-bar {
    bottom: 22px;
    right: 22px;
  }

  .settings-menu-inner .setting-item {
    justify-content: space-between;
  }

  .settings-menu-inner .setting-slider-control {
    width: 260px;
  }

  .settings-menu-inner .setting-slider-control .param-slider {
    min-width: 180px;
  }

  .video-effect-selector {
    max-width: 980px;
    margin: 0 auto;
  }

  .video-effect-selector .effect-list {
    justify-content: center;
  }
}
@media (min-width: 1200px) {
  .bottom-sheet.expanded {
    max-height: 60vh;
  }
  .sheet-content {
    max-height: calc(60vh - 40px);
  }
}

:deep(.sheet-content::-webkit-scrollbar) {
  width: 6px;
}
:deep(.sheet-content::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}
:deep(.sheet-content::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.2s ease;
}
:deep(.sheet-content::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.3);
}

.draggable-float-container,
.control-float-btn,
.control-circle-container {
  display: none !important;
}

/* 新布局样式 - 视频播放风格 */

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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-weight: 700;
  color: #1d1d1f;
  font-size: 15px;
  letter-spacing: 0.3px;
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

.panel-footer .ant-btn-default {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.panel-footer .ant-btn-default:hover {
  border-color: #1677ff;
  color: #1677ff;
}

/* 特效面板 */
.effect-scroll-container {
  max-height: 380px;
  overflow-y: auto;
  padding: 16px;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.effect-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.effect-card:hover {
  border-color: #1677ff;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.15);
}

.effect-card-thumb {
  width: 100%;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
}

.effect-card-title {
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
  text-align: center;
  color: #1d1d1f;
}

/* 设置面板 */
.settings-content {
  padding: 16px;
}

.setting-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  margin-bottom: 10px;
  margin-top: 4px;
}

.setting-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 12px 0;
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

.setting-item-tip {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  line-height: 1.4;
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

.setting-value {
  font-size: 12px;
  color: #666;
  min-width: 28px;
  text-align: right;
}

/* 编辑面板 */
.edit-modal-content {
  padding: 16px;
  overflow-y: auto;
}

.axis-panels {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.axis-panel {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.axis-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.axis-panel-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.axis-panel-title {
  font-size: 12px;
  font-weight: 500;
}

.axis-slider-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.axis-slider-row:last-child {
  margin-bottom: 0;
}

.axis-side-btn {
  min-width: 36px;
  padding: 0 4px;
  font-size: 11px;
}

.axis-slider-row .param-slider {
  flex: 1;
  margin: 0;
}

.axis-row-value {
  font-size: 11px;
  color: #666;
  min-width: 36px;
  text-align: right;
}

/* 视频特效面板 */
.video-effect-selector {
  padding: 16px;
}

.video-effect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.video-effect-selector .effect-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.video-effect-selector .effect-option:hover {
  border-color: #1677ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.15);
}

.video-effect-selector .effect-option.active {
  border-color: #1677ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f7ff 100%);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);
}

.video-effect-selector .effect-icon {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.video-effect-selector .effect-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-effect-selector .effect-name {
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
}

.video-effect-selector .tips-text {
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  margin: 14px 0 0;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
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

.motion-type-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.motion-type-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
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

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-group.left {
  flex-shrink: 0;
}

.btn-group.center {
  flex: 1;
  justify-content: center;
}

.btn-group.right {
  flex-shrink: 0;
  width: fit-content;
}

.btn-group.right-center {
  flex-shrink: 0;
  justify-content: flex-end;
}

/* 右侧中间控制组 - 垂直排列 */
.right-center-controls {
  position: fixed;
  right: var(--control-bar-gap);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  box-shadow: 0 -6px 25px rgba(0, 0, 0, 0.15);
}

.right-center-controls.visible {
  opacity: 1;
}

/* 模式提示 */
.mode-tip {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: modeTipFadeIn 0.3s ease;
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

.mode-tip.fly-mode {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(238, 90, 36, 0.4);
}

.mode-tip.annotation-mode {
  background: linear-gradient(135deg, #a55eea 0%, #8854d0 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(136, 84, 208, 0.4);
}

.mode-tip.edit-mode {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.4);
}

.mode-tip .mode-icon {
  font-size: 16px;
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
  z-index: 99;
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

/* 调整右上角面板在模式提示时不被遮挡 */
.feature-panel:not(.top-right-panel) {
  top: 115px;
}

.control-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--control-btn-size);
  padding: 6px;
  border-radius: 8px;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  transition: all 0.2s ease;
}

.control-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
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

.control-icon-btn .anticon {
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .feature-panel {
    right: 8px;
    left: 8px;
    width: auto;
  }

  .feature-panel.top-right-panel {
    left: 8px;
    right: 8px;
    width: auto;
  }

  .mode-tip {
    top: 10px;
    padding: 6px 14px;
    font-size: 12px;
  }

  .feature-panel:not(.top-right-panel) {
    top: 56px;
  }

  .bottom-controls {
    padding: 10px 12px 12px;
  }

  .control-buttons {
    flex-wrap: wrap;
    gap: 6px;
  }

  .btn-group {
    gap: 4px;
  }

  .right-center-controls {
    right: 8px;
    gap: 6px;
  }

  .btn-group.right-center {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 6px;
  }

  .control-icon-btn {
    width: 38px;
    height: 38px;
    --control-btn-size: 38px;
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
  transition: background 0.2s ease;
}

.gesture-item:hover {
  background: #f0f0f0;
}

.gesture-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  border-radius: 8px;
  color: #1890ff;
  font-size: 16px;
  flex-shrink: 0;
}

.gesture-key {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1d1d1f;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.gesture-text {
  flex: 1;
  min-width: 0;
}

.gesture-action {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 2px;
}

.gesture-detail {
  font-size: 12px;
  color: #8c8c8c;
}

/* 快照边框效果 */
.snapshot-border-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  box-shadow: inset 0 0 0 0 rgba(255, 255, 255, 0);
  animation: snapshotBorderFlash 0.2s ease-out;
}

@keyframes snapshotBorderFlash {
  0% {
    box-shadow: inset 0 0 0 0 rgba(255, 255, 255, 0);
  }
  50% {
    box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.8);
  }
  100% {
    box-shadow: inset 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

/* 标注操作菜单 */
.annotation-menu-popup {
  position: fixed;
  transform: translate(-50%, -50%);
  z-index: 2000;
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px;
}

.annotation-menu-items {
  display: flex;
  gap: 2px;
}

.annotation-menu-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #fff;
}

.annotation-menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.annotation-menu-btn.annotation-menu-delete:hover {
  background: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

.annotation-menu-btn .anticon {
  font-size: 14px;
}

/* :deep(.ant-btn)
{
  height: auto;
} */
</style>

<style>
html{
  overflow: hidden;
}
</style>