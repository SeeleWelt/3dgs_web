<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 用户信息卡片 -->
      <div class="profile-header-card">
        <div class="header-main">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <a-image
                :src="avatarSrc"
                class="avatar-image"
                placeholder
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="
                preview
              />
            </div>
            <button
              class="avatar-edit-btn"
              @click="triggerFile"
              :title="t('profile.editAvatar')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onFileChange"
              class="avatar-file-input"
            />
          </div>

          <!-- 用户基础信息 -->
          <div class="user-info">
            <div class="user-name-row">
              <h1 class="username">{{ user?.username || t('profile.anonymous') }}</h1>
              <!-- <a-tag :class="user?.isPro ? 'user-level-tag-vip' : 'user-level-tag'" color="blue">{{ user?.isPro ? "vip用户" : "普通用户" }}</a-tag> -->
            </div>
            <div class="user-meta">
              <span class="meta-item">
                <UserOutlined />
                <span>{{ user?.nickname || t('profile.noNickname') }}</span>
                <a-button type="link" class="nickname-edit-link" @click="toggleEditName">
                  <EditOutlined />
                </a-button>
              </span>
              <span class="meta-item" v-if="user?.loginTime">
                <ClockCircleOutlined />
                <span>{{ formatLoginTime(user.loginTime) }}活跃</span>
              </span>
            </div>
          </div>

          <!-- 算力点卡片 -->
          <div class="points-card" @click="showPointsLogs = true">
            <div class="points-icon">
              <svg viewBox="0 0 1024 1024" width="36" height="36">
                <path d="M512 0c282.763636 0 512 229.236364 512 512s-229.236364 512-512 512S0 794.763636 0 512 229.236364 0 512 0z m208.011636 209.454545H460.194909a5.306182 5.306182 0 0 0-4.654545 3.188364L279.970909 563.502545a7.168 7.168 0 0 0 0 6.237091 5.352727 5.352727 0 0 0 4.654546 3.141819h118.202181l-60.625454 280.41309c-1.303273 6.097455 5.073455 10.379636 9.006545 6.027637l391.819637-432.663273c1.629091-1.861818 2.094545-4.491636 1.28-6.842182-0.814545-2.373818-2.816-3.909818-5.026909-3.909818h-149.248l134.213818-196.235636a7.144727 7.144727 0 0 0 0.651636-6.632728 5.492364 5.492364 0 0 0-4.910545-3.584z" fill="#F1BA5A"></path>
              </svg>
            </div>
            <div class="points-content">
              <div class="points-value">{{ currentPoints }}</div>
              <div class="points-label">算力点</div>
            </div>
            <RightOutlined class="points-arrow" />
          </div>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="profile-body">
        <!-- 左侧侧边栏 -->
        <div class="profile-sidebar">
          <!-- 账户概览 -->
          <div class="sidebar-card account-overview" v-if="false"> 
            <h3 class="sidebar-title">
              <BarChartOutlined />
              账户概览
            </h3>
            <div class="overview-stats">
              <div class="overview-stat">
                <div class="stat-number">0</div>
                <div class="stat-label">作品数</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">0</div>
                <div class="stat-label">收藏数</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">0</div>
                <div class="stat-label">分享数</div>
              </div>
            </div>
          </div>

          <!-- 账户安全 -->
          <div class="sidebar-card security-section">
            <h3 class="sidebar-title">
              <SafetyOutlined />
              账户安全
            </h3>
            <div class="security-list">
              <div class="security-item" @click="showChangePwdModal = true">
                <LockOutlined class="security-icon" />
                <span class="security-text">修改密码</span>
                <RightOutlined class="security-arrow" />
              </div>
              <div class="security-item" @click="openBindPhoneModal" >
                <MobileOutlined class="security-icon" />
                <span class="security-text">{{ hasBoundPhone ? '已绑定手机' : '绑定手机' }}</span>
                <a-tag :color="hasBoundPhone ? 'success' : 'default'" size="small">
                  {{ hasBoundPhone ? '已绑定' : '未绑定' }}
                </a-tag>
              </div>
              <div class="security-item" @click="openBindEmailModal">
                <MailOutlined class="security-icon" />
                <span class="security-text">{{ hasBoundEmail ? '已绑定邮箱' : '绑定邮箱' }}</span>
                <a-tag :color="hasBoundEmail ? 'success' : 'default'" size="small">
                  {{ hasBoundEmail ? '已绑定' : '未绑定' }}
                </a-tag>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="sidebar-card quick-actions">
            <h3 class="sidebar-title">
              <ThunderboltOutlined />
              快速操作
            </h3>
            <div class="action-buttons">
              <a-button class="action-btn" block @click="toggleEditName">
                <EditOutlined />修改昵称
              </a-button>
              <a-button class="action-btn" block @click="triggerFile">
                <CameraOutlined />更换头像
              </a-button>
              <a-button class="action-btn" block @click="showPointsLogs = true">
                <HistoryOutlined />算力记录
              </a-button>
            </div>
          </div>
        </div>

        <!-- 右侧内容区域 -->
        <div class="profile-content">
          <!-- 基本信息卡片 -->
          <div class="content-card">
            <div class="card-header">
              <h3 class="card-title">
                <UserOutlined />
                个人信息
              </h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">用户名</div>
                <div class="info-value">{{ user?.username || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">昵称</div>
                <div class="info-value">{{ user?.nickname || '未设置' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">手机号</div>
                <div class="info-value" v-if="hasBoundPhone">{{ user?.phone }}</div>
                <a-button v-else type="text" size="small" class="bind-link-btn" @click="openBindPhoneModal">
                  <PlusOutlined />绑定手机
                </a-button>
              </div>
              <div class="info-item">
                <div class="info-label">邮箱</div>
                <div class="info-value" v-if="hasBoundEmail">{{ displayEmail }}</div>
                <a-button v-else type="text" size="small" class="bind-link-btn" @click="openBindEmailModal">
                  <PlusOutlined />绑定邮箱
                </a-button>
              </div>
              <div class="info-item">
                <div class="info-label">账户状态</div>
                <div class="info-value">
                  <a-tag color="success">{{userStatus}}</a-tag>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">上次登录</div>
                <div class="info-value">{{ formatLoginTime(user?.loginTime || '') || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- 账户设置卡片 -->
          <div class="content-card">
            <div class="card-header">
              <h3 class="card-title">
                <SettingOutlined />
                账户设置
              </h3>
            </div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-left">
                  <BellOutlined class="settings-icon" />
                  <span>消息通知</span>
                </div>
                <a-switch v-model:checked="settings.notifications" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="showChangePwdModal"
      :title="t('profile.changePassword')"
      :ok-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      @ok="handleChangePwd"
    >
      <a-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" layout="vertical" class="pwd-form" @keydown.enter.prevent="handleChangePwd">
        <a-form-item name="oldPwd" :label="t('profile.oldPassword')">
          <a-input-password
            v-model:value="pwdForm.oldPwd"
            :placeholder="t('profile.enterOldPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item name="newPwd" :label="t('profile.newPassword')">
          <a-input-password
            v-model:value="pwdForm.newPwd"
            :placeholder="t('profile.enterNewPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item name="confirmPwd" :label="t('profile.confirmPassword')">
          <a-input-password
            v-model:value="pwdForm.confirmPwd"
            :placeholder="t('profile.confirmNewPwd')"
            autocomplete="off"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 昵称编辑弹窗 -->
    <a-modal
      v-model:open="editingName"
      :title="t('profile.editNickname')"
      :ok-text="t('common.save')"
      :cancel-text="t('common.cancel')"
      @ok="saveName"
      @cancel="nameValue = editingNameOriginal; editingName = false"
      :ok-button-props="{ disabled: !canSaveNickname }"
    >
      <a-input
        v-model:value="nameValue"
        :placeholder="t('profile.enterNickname')"
        @press.enter="saveName"
      />
    </a-modal>

    <!-- 绑定手机弹窗 -->
    <a-modal
      v-model:open="showBindPhoneModal"
      title="绑定手机号"
      :footer="null"
      @cancel="closeBindPhoneModal"
      :width="420"
    >
      <div class="phone-auth-section" :class="{ 'is-loading': isBindLoading }">
        <!-- 步骤1：手机号输入 -->
        <div v-if="bindStep === 'phone'" class="step-container">
          <a-form
            ref="bindPhoneFormRef"
            :model="bindPhoneForm"
            :rules="bindPhoneRules"
            layout="vertical"
            class="form-fields"
          >
            <a-form-item name="phone" label="手机号" class="form-group">
              <a-input
                v-model:value="bindPhoneForm.phone"
                type="tel"
                class="form-input phone-input"
                placeholder="请输入手机号"
                maxlength="16"
                @keypress.enter="goBindPhoneNext"
              >
                <template #prefix>
                  <a-select
                    v-model:value="selectedBindAreaCode"
                    class="area-code-select"
                    @change="handleBindAreaCodeChange"
                  >
                    <a-select-option value="+86">
                      <span class="flag-option"><span class="fi fi-cn"></span> +86</span>
                    </a-select-option>
                    <a-select-option value="+1">
                      <span class="flag-option"><span class="fi fi-us"></span> +1</span>
                    </a-select-option>
                    <a-select-option value="+44">
                      <span class="flag-option"><span class="fi fi-gb"></span> +44</span>
                    </a-select-option>
                    <a-select-option value="+81">
                      <span class="flag-option"><span class="fi fi-jp"></span> +81</span>
                    </a-select-option>
                    <a-select-option value="+49">
                      <span class="flag-option"><span class="fi fi-de"></span> +49</span>
                    </a-select-option>
                    <a-select-option value="+33">
                      <span class="flag-option"><span class="fi fi-fr"></span> +33</span>
                    </a-select-option>
                    <a-select-option value="+7">
                      <span class="flag-option"><span class="fi fi-ru"></span> +7</span>
                    </a-select-option>
                    <a-select-option value="+34">
                      <span class="flag-option"><span class="fi fi-es"></span> +34</span>
                    </a-select-option>
                  </a-select>
                </template>
              </a-input>
            </a-form-item>
          </a-form>
          <a-button
            type="primary"
            class="btn btn-full"
            :loading="isBindLoading"
            :disabled="!isBindPhoneValid"
            @click="goBindPhoneNext"
          >
            获取验证码
          </a-button>
        </div>

        <!-- 步骤2：验证码输入 -->
        <div v-else class="step-container" >
          <div class="phone-info">
            <span class="info-value">{{ selectedBindAreaCode }} {{ bindPhoneForm.phone }}</span>
            <a class="back-btn" @click="backToBindPhoneStep">返回修改</a>
          </div>

          <div class="code-input-section">
            <SmsCodeInput
              v-model="bindPhoneForm.code"
              :length="6"
              class="verification-input"
              @enter="submitBindPhone"
            />
          </div>

          <div class="resend-container">
            <a
              class="resend-link"
              :class="{ disabled: bindCountdown > 0 }"
              @click.prevent="bindCountdown <= 0 && sendBindPhoneCode()"
            >
              <span v-if="bindCountdown > 0">{{ bindCountdown }}s 后重发</span>
              <span v-else>重新发送验证码</span>
            </a>
          </div>

          <a-button
            type="primary"
            class="btn btn-full"
            :loading="isBindLoading"
            :disabled="!bindPhoneForm.code || bindPhoneForm.code.length !== 6"
            @click="submitBindPhone"
          >
            绑定手机号
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 绑定邮箱弹窗 -->
    <a-modal
      v-model:open="showBindEmailModal"
      title="绑定邮箱"
      :footer="null"
      @cancel="closeBindEmailModal"
      :width="420"
    >
      <div class="phone-auth-section">
        <!-- 步骤1：邮箱输入 -->
        <div v-if="bindEmailStep === 'email'" class="step-container">
          <a-form
            ref="bindEmailFormRef"
            :model="bindEmailForm"
            :rules="bindEmailRules"
            layout="vertical"
            class="form-fields"
          >
            <a-form-item name="email" label="邮箱" class="form-group">
              <a-input
                v-model:value="bindEmailForm.email"
                type="email"
                class="form-input"
                placeholder="请输入邮箱地址"
                @keypress.enter="goBindEmailNext"
              />
            </a-form-item>
          </a-form>
          <a-button
            type="primary"
            class="btn btn-full"
            :loading="isBindEmailLoading"
            @click="goBindEmailNext"
          >
            获取验证码
          </a-button>
        </div>

        <!-- 步骤2：验证码输入 -->
        <div v-else class="step-container" :class="{ 'is-loading': isBindEmailLoading }">
          <div class="phone-info">
            <span class="info-value">{{ bindEmailForm.email }}</span>
            <a class="back-btn" @click="backToBindEmailStep">返回修改</a>
          </div>

          <div class="code-input-section">
            <EmailInputCode
              v-model="bindEmailForm.code"
              :length="6"
              class="verification-input"
              @enter="submitBindEmail"
            />
          </div>

          <a-button
            type="primary"
            class="btn btn-full"
            :loading="isBindEmailLoading"
            :disabled="!bindEmailForm.code || bindEmailForm.code.length !== 6"
            @click="submitBindEmail"
          >
            绑定邮箱
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 头像裁剪 -->
    <AvatarCropper
      v-model:open="showCropperModal"
      :image="cropperImageUrl"
      :file-name="cropperFileName"
      aspect-ratio="1:1"
      img-format="jpeg"
      :image-size="cropperImageSize"
      @crop="handleCropResult"
    />

    <!-- 算力点日志 -->
    <PointsLogs v-model:open="showPointsLogs" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { usePointsStore } from '@/stores/points'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RightOutlined,
  LockOutlined,
  MobileOutlined,
  MailOutlined,
  BarChartOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CameraOutlined,
  HistoryOutlined,
  PlusOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons-vue'
import SmsCodeInput from '../components/SmsCodeInput.vue'
import EmailInputCode from '../components/EmailInputCode.vue'
import AvatarCropper from '../components/AvatarCropper.vue'
import PointsLogs from '../components/PointsLogs.vue'

const { t } = useI18n()
const userStore = useUserStore()
const pointsStore = usePointsStore()
const user = computed(() => userStore.userInfo || null)
const userStatus = computed(() => {
  if (user.value?.userStatus === 0) return '封禁'
  if (user.value?.userStatus === 1) return '正常'
  if (user.value?.userStatus === 2) return '注销中'
  if (user.value?.userStatus === 3) return '已注销'
  return '未知'
})

// 账户设置
const settings = reactive({
  notifications: true
})

// 算力点
const showPointsLogs = ref(false)
const currentPoints = computed(() => pointsStore.current_points)

onMounted(() => {
  try {
    pointsStore.getPoints()
    pointsStore.getPointsAllLogs()
  } catch (error) {
    console.error('获取算力点信息失败:', error)
  }
})

// 格式化登录时间
const formatLoginTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

// 编辑昵称
const editingName = ref(false)
const nameValue = ref('')
const editingNameOriginal = ref('')

// 头像
const avatarPreview = ref<string | null>('/default.svg')
const fileInput = ref<HTMLInputElement | null>(null)
const showCropperModal = ref(false)
const cropperImageUrl = ref('')
const cropperImageSize = ref(0)
const cropperFileName = ref('avatar.jpg')

// 修改密码
const showChangePwdModal = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = ref({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

// 绑定手机
const showBindPhoneModal = ref(false)
const bindPhoneFormRef = ref<FormInstance>()
const bindStep = ref<'phone' | 'code'>('phone')
const bindPhoneForm = ref({ phone: '', code: '' })
const selectedBindAreaCode = ref('+86')
const bindCountdown = ref(0)
const isBindLoading = ref(false)
let bindCountdownTimer: ReturnType<typeof setInterval> | null = null

// 绑定邮箱
const showBindEmailModal = ref(false)
const bindEmailFormRef = ref<FormInstance>()
const bindEmailStep = ref<'email' | 'code'>('email')
const bindEmailForm = ref({ email: '', code: '' })
const isBindEmailLoading = ref(false)

// 计算属性
const canSaveNickname = computed(() => nameValue.value.trim().length > 0)
const avatarSrc = computed(() => avatarPreview.value || user.value?.headimg || '')
const isPhoneLoginUser = computed(() => user.value?.loginType === 'phone')
const hasBoundPhone = computed(() => !!user.value?.phone && String(user.value.phone).trim().length > 0)
const boundEmailMatch = computed(() => {
  const username = user.value?.username || ''
  return username.match(/^user_(.+@[^\s@]+\.[^\s@]+)$/i)
})
const hasBoundEmail = computed(() => !!boundEmailMatch.value?.[1])
const displayEmail = computed(() => {
  const username = user.value?.username || ''
  const prefixedEmailMatch = username.match(/^user_(.+@[^\s@]+\.[^\s@]+)$/i)
  if (prefixedEmailMatch?.[1]) return prefixedEmailMatch[1]
  return '未绑定'
})

// 密码正则
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/

// 手机号验证
const phonePatterns: Record<string, RegExp> = {
  '+86': /^1[3-9]\d{9}$/,
  '+1': /^\d{10}$/,
  '+44': /^\d{10,11}$/,
  '+81': /^\d{10,11}$/,
  '+49': /^\d{10,11}$/,
  '+33': /^\d{9,10}$/,
  '+7': /^\d{10}$/,
  '+34': /^\d{9}$/
}

const isBindPhoneValid = computed(() => {
  const pattern = phonePatterns[selectedBindAreaCode.value as keyof typeof phonePatterns]
  return pattern && pattern.test(bindPhoneForm.value.phone)
})

const handleBindAreaCodeChange = () => {
  if (bindPhoneFormRef.value) {
    bindPhoneFormRef.value.validateFields(['phone'])
  }
}

const resolveBindPhonePattern = () => {
  return phonePatterns[selectedBindAreaCode.value] || /^1\d{10}$/
}

const buildBindPhonePayload = (phone: string) => {
  const rawPhone = phone.trim()
  if (selectedBindAreaCode.value === '+86') {
    return rawPhone
  }
  return `${selectedBindAreaCode.value}${rawPhone}`
}

// 表单验证规则
const pwdRules = computed(() => ({
  oldPwd: [
    {
      validator(_: any, value: string) {
        if (isPhoneLoginUser.value) return Promise.resolve()
        if (!value || !value.trim()) return Promise.reject(new Error('请输入原密码'))
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度应为8-16位', trigger: 'blur' },
    { pattern: passwordRegex, message: '密码必须包含大写字母、小写字母和数字', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator(_: any, value: string) {
        if (value !== pwdForm.value.newPwd) return Promise.reject(new Error('两次输入的密码不一致'))
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}))

const bindPhoneRules = computed(() => ({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator(_: any, value: string) {
        if (!value || !value.trim()) return Promise.resolve()
        const pattern = resolveBindPhonePattern()
        if (!pattern.test(value.trim())) return Promise.reject(new Error('请输入有效的手机号'))
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}))

const bindEmailRules = computed(() => ({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}))

// 初始化用户数据
if (user.value) {
  nameValue.value = user.value.nickname || ''
  avatarPreview.value = user.value.headimg || '/default.svg'
}

// 方法
const toggleEditName = () => {
  editingNameOriginal.value = nameValue.value
  editingName.value = true
}

const saveName = () => {
  const newName = nameValue.value.trim()
  if (!newName) {
    message.warning(t('profile.nicknameRequired'))
    return
  }
  userStore.modifyNickname(newName)
  editingName.value = false
  message.success(t('profile.saveSuccess'))
}

const triggerFile = () => {
  fileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    message.error(t('profile.avatarSizeLimit'))
    return
  }

  if (cropperImageUrl.value) {
    URL.revokeObjectURL(cropperImageUrl.value)
  }

  cropperImageUrl.value = URL.createObjectURL(file)
  cropperImageSize.value = file.size
  cropperFileName.value = file.name || 'avatar.jpg'
  showCropperModal.value = true

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleCropResult = (payload: { dataUrl: string }) => {
  avatarPreview.value = payload.dataUrl
  userStore.modifyHeadImage(payload.dataUrl)
  message.success(t('profile.avatarSaved'))
}

const handleChangePwd = async () => {
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return
  }

  const oldPwdValue = isPhoneLoginUser.value ? '' : pwdForm.value.oldPwd.trim()
  const ok = await userStore.modifyPassword(oldPwdValue, pwdForm.value.newPwd.trim())
  if (!ok) return

  showChangePwdModal.value = false
  pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  pwdFormRef.value?.clearValidate()
}

const startBindCountdown = () => {
  if (bindCountdownTimer) clearInterval(bindCountdownTimer)
  bindCountdown.value = 60
  bindCountdownTimer = setInterval(() => {
    bindCountdown.value -= 1
    if (bindCountdown.value <= 0 && bindCountdownTimer) {
      clearInterval(bindCountdownTimer)
      bindCountdownTimer = null
    }
  }, 1000)
}

const openBindPhoneModal = () => {
  if(hasBoundPhone.value) {
    return
  }
  bindStep.value = 'phone'
  bindPhoneForm.value = { phone: '', code: '' }
  selectedBindAreaCode.value = '+86'
  bindCountdown.value = 0
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
  showBindPhoneModal.value = true
}

const closeBindPhoneModal = () => {
  showBindPhoneModal.value = false
  bindStep.value = 'phone'
  bindPhoneForm.value = { phone: '', code: '' }
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
  bindCountdown.value = 0
}

const backToBindPhoneStep = () => {
  bindStep.value = 'phone'
  bindPhoneForm.value.code = ''
  bindCountdown.value = 0
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
}

const goBindPhoneNext = async () => {
  
  try {
    isBindLoading.value = true
    await bindPhoneFormRef.value?.validateFields(['phone'])
    const ok = await userStore.sendPhoneCode(buildBindPhonePayload(bindPhoneForm.value.phone.trim()))
    bindStep.value = 'code'
    bindPhoneForm.value.code = ''
    if (!ok) return
    startBindCountdown()
  } catch {
    return
  } finally {
    isBindLoading.value = false
  }
}

const sendBindPhoneCode = async () => {
  if (bindCountdown.value > 0) return
  isBindLoading.value = true
  const phone = bindPhoneForm.value.phone.trim()
  if (!resolveBindPhonePattern().test(phone)) {
    message.warning('请输入有效的手机号')
    isBindLoading.value = false
    return
  }
  const ok = await userStore.sendPhoneCode(buildBindPhonePayload(phone))
  if (ok) startBindCountdown()
  isBindLoading.value = false
}

const submitBindPhone = async () => {
  const code = bindPhoneForm.value.code.trim()
  const phone = bindPhoneForm.value.phone.trim()
  if (!code || code.length !== 6) {
    message.warning('请输入6位验证码')
    return
  }
  isBindLoading.value = true
  const ok = await userStore.bindPhone(buildBindPhonePayload(phone), code)
  isBindLoading.value = false
  if (!ok) return
  closeBindPhoneModal()
}

const openBindEmailModal = () => {
  if (hasBoundEmail.value) {
    return
  }
  bindEmailStep.value = 'email'
  bindEmailForm.value = { email: '', code: '' }
  showBindEmailModal.value = true
}

const closeBindEmailModal = () => {
  showBindEmailModal.value = false
  bindEmailStep.value = 'email'
  bindEmailForm.value = { email: '', code: '' }
}

const backToBindEmailStep = () => {
  bindEmailStep.value = 'email'
  bindEmailForm.value.code = ''
}

const goBindEmailNext = async () => {
  isBindEmailLoading.value = true
  try {
    await bindEmailFormRef.value?.validateFields(['email'])
  } catch {
    isBindEmailLoading.value = false
    return
  }

  const ok = await userStore.sendEmailCode(bindEmailForm.value.email.trim())
  bindEmailStep.value = 'code'
  bindEmailForm.value.code = ''
  isBindEmailLoading.value = false
  if (!ok) return
  message.info('绑定邮箱提交接口暂未开放，当前为流程演示')
}

const submitBindEmail = () => {
  if (!bindEmailForm.value.code || bindEmailForm.value.code.trim().length !== 6) {
    message.warning('请输入6位验证码')
    return
  }
  message.info('绑定邮箱接口暂未开放，暂无法提交绑定')
}

onBeforeUnmount(() => {
  if (cropperImageUrl.value) {
    URL.revokeObjectURL(cropperImageUrl.value)
  }
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
  }
})
</script>

<style scoped>
/* 全局容器 */
.profile-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.profile-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

/* 用户信息卡片 */
.profile-header-card {
  background: var(--glass-surface, rgba(255,255,255,0.9));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 32px;
}

/* 头像 */
.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-wrapper :deep(.ant-image-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.avatar-edit-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.avatar-file-input {
  display: none;
}

/* 用户信息 */
.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.username {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  background: linear-gradient(135deg, #1a1a2e, #4a4a6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-level-tag {
  background: linear-gradient(135deg, rgb(77, 75, 75), #413839) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
}

.user-level-tag-vip {
  background: linear-gradient(135deg, #f093fb, #f5576c) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
}

.user-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.meta-item :deep(.anticon) {
  color: #999;
}

/* 算力点卡片 */
.points-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
}

.points-card:hover {
  background: #f0f0f0;
  border-color: #d9d9d9;
}

.points-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 8px;
}

.points-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.points-content {
  flex: 1;
}

.points-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.points-label {
  font-size: 12px;
  color: #999;
}

.points-arrow {
  color: #bbb;
  font-size: 12px;
}

/* 主体布局 */
.profile-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 侧边栏 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-card {
  background: var(--glass-surface, rgba(255,255,255,0.9));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.sidebar-title :deep(.anticon) {
  color: #667eea;
}

/* 账户概览 */
.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.overview-stat {
  text-align: center;
  padding: 16px 8px;
  background: linear-gradient(135deg, #f8f9ff, #fff);
  border-radius: 12px;
  border: 1px solid #eee;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 安全设置 */
.security-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8f9ff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.security-item:hover {
  background: #eef0ff;
  transform: translateX(4px);
}

.security-icon {
  color: #667eea;
  font-size: 18px;
}

.security-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.security-arrow {
  color: #ccc;
  font-size: 12px;
}

/* 快速操作 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  height: 42px !important;
  border-radius: 10px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 1px solid #e0e0e0 !important;
  background: #fff !important;
  color: #666 !important;
}

.action-btn:hover {
  border-color: #667eea !important;
  color: #667eea !important;
  background: #f8f9ff !important;
}

/* 右侧内容 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-card {
  background: var(--glass-surface, rgba(255,255,255,0.9));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.card-title :deep(.anticon) {
  color: #667eea;
}

.edit-btn {
  color: #667eea !important;
  font-weight: 500;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  color: #999;
}

.info-value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.bind-link-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  color: #667eea !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  padding: 2px 8px !important;
  height: auto !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
}

.bind-link-btn:hover {
  background: rgba(102, 126, 234, 0.1) !important;
  color: #5a6fd6 !important;
}

.nickname-edit-link {
  padding: 0 4px !important;
  height: auto !important;
  color: #999 !important;
}

.nickname-edit-link:hover {
  color: #667eea !important;
}

/* 设置列表 */
.settings-list {
  display: flex;
  flex-direction: column;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-icon {
  color: #667eea;
  font-size: 18px;
}

/* 弹窗样式 */
.bind-modal-content {
  padding: 8px 0;
}

.bind-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.phone-confirm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.code-input {
  margin: 16px 0;
}

.resend-row {
  text-align: center;
}

.resend-row a {
  color: #667eea;
}

.email-tip {
  text-align: center;
  color: #666;
  margin-bottom: 16px;
}

/* PhoneAuth 样式 */
.phone-auth-section {
  width: 100%;
}


.step-container {
  width: 100%;
  position: relative;
}

.phone-auth-section.is-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(1px);
  border-radius: 8px;
  z-index: 10;
}

.form-fields {
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.phone-input {
  width: 100%;
}

.area-code-select {
  border: none;
  background: transparent;
  z-index: 1;
}

.flag-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.flag-option .fi {
  font-size: 16px;
}

:deep(.ant-select-item-option-content .flag-option) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:deep(.ant-select-item-option-content .fi) {
  font-size: 18px;
}

:deep(.area-code-select .ant-select-selector) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.area-code-select .ant-select-selection-item) {
  font-weight: 500;
  color: #333;
}

:deep(.ant-btn){
  height: auto;
}

.form-input {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  color: #1a1a1a;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  padding: 12px 16px;
}

.form-input:focus {
  background: #ffffff;
  border-color: #00c6ff;
  box-shadow: none;
}

.form-input:hover {
  border-color: #00c6ff;
}

.form-input::placeholder {
  color: #aaa;
}

.phone-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 10px;
  margin-bottom: 20px;
}

.resend-container {
  text-align: center;
  margin-bottom: 20px;
}

.resend-link {
  font-size: 13px;
  color: #0072ff;
  cursor: pointer;
  text-decoration: none;
}

.resend-link.disabled {
  color: #999;
  cursor: default;
}

.resend-link:hover:not(.disabled) {
  text-decoration: underline;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.back-btn {
  font-size: 13px;
  color: #0072ff;
  cursor: pointer;
  text-decoration: none;
}

.back-btn:hover {
  color: #0058d9;
}

.code-input-section {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

:deep(.verification-input) {
  display: flex;
  justify-content: center;
  width: 100%;
}

:deep(.verification-input .sms-code-input) {
  margin: 0 auto;
}

:deep(.verification-input .code-input-wrapper) {
  margin: 0 auto;
}

:deep(.verification-input input) {
  width: 40px !important;
  height: 40px !important;
  margin: 0 4px !important;
  border: 1px solid #e8e8e8 !important;
  border-radius: 8px !important;
  text-align: center !important;
  font-size: 18px !important;
  font-weight: 500 !important;
}

:deep(.verification-input input:focus) {
  border-color: #00c6ff !important;
  box-shadow: 0 0 0 2px rgba(0, 198, 255, 0.2) !important;
  outline: none !important;
}

.btn {
  width: 100%;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-full {
  margin-top: 8px;
}

:deep(.ant-form-item-explain-error) {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

/* 入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.profile-header-card {
  animation: fadeInUp 0.6s ease forwards;
}

.profile-sidebar .sidebar-card:nth-child(1) {
  animation: fadeInUp 0.6s ease 0.1s forwards;
  opacity: 0;
}

.profile-sidebar .sidebar-card:nth-child(2) {
  animation: fadeInUp 0.6s ease 0.2s forwards;
  opacity: 0;
}

.profile-sidebar .sidebar-card:nth-child(3) {
  animation: fadeInUp 0.6s ease 0.3s forwards;
  opacity: 0;
}

.profile-content .content-card:nth-child(1) {
  animation: fadeInUp 0.6s ease 0.15s forwards;
  opacity: 0;
}

.profile-content .content-card:nth-child(2) {
  animation: fadeInUp 0.6s ease 0.25s forwards;
  opacity: 0;
}

/* 响应式 */
@media (max-width: 992px) {
  .profile-body {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    order: 2;
  }

  .profile-content {
    order: 1;
  }

}

@media (max-width: 768px) {
  .profile-container {
    padding: 0 16px 32px;
  }
  .profile-header-card {
    padding: 24px;
  }

  .header-main {
    flex-direction: column;
    text-align: center;
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .username {
    font-size: 24px;
  }

  .user-meta {
    justify-content: center;
    flex-wrap: wrap;
  }

  .points-card {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
