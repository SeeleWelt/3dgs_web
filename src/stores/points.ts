import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '../utils/api'
import { ApiServer } from '@/utils/taskService'
import { message } from 'ant-design-vue'


export const usePointsStore = defineStore('points', () => {
    const current_points = ref(0)
    const total_points = ref(0)
    const points_rules = ref({})
    const points_logs = ref([])
    const points_dayly_log = ref(null)

    const getPointsDaylyLogs = async () => {
        const response = await ApiServer.request(
            {
                method: 'POST',
                url: API.BASE_URL + API.GET_POINTS_DAILY_LOG,
            }
        )
        console.log(response.data)
        points_dayly_log.value = response.data.message
        total_points.value = response.data.compute_credits_total
        current_points.value = response.data.compute_credits
    }

    const getPointsAllLogs = async () => {
        const response = await ApiServer.request(
            {
                method: 'GET',
                url: API.BASE_URL + API.GET_POINTS_ALL_LOG,
            }
        )
        console.log(response.data)
        points_logs.value = response.data.list
    }

    const getPointsRules = async () => {
        const response = await ApiServer.request(
            {
                method: 'POST',
                url: API.BASE_URL + API.GET_POINTS_RULES,
            }
        )
        console.log(response.data)
        points_rules.value = response.data.data
    }

    const getPoints = async () => {
        const response = await ApiServer.request(
            {
                method: 'GET',
                url: API.BASE_URL + API.GET_POINTS,
            }
        )
        console.log('获取积分:', response.data)
        current_points.value = response.data.compute_credits
        total_points.value = response.data.compute_credits_total
    }

    return{
        getPointsRules,
        getPoints,
        getPointsAllLogs,
        getPointsDaylyLogs,
        current_points: computed(() => current_points.value),
        total_points: computed(() => total_points.value),
        points_rules: computed(() => points_rules.value),
        points_logs: computed(() => points_logs.value),
        points_dayly_log: computed(() => points_dayly_log.value)
    }
})
