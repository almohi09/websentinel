package com.websentinel.scanner.scheduler;

import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    @Bean
    public JobDetail scheduledScanJobDetail() {
        return JobBuilder.newJob(ScheduledScanJob.class)
            .withIdentity("scheduledScanJob", "security-scans")
            .withDescription("Recurring automated security scan for verified website fleet")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger scheduledScanTrigger(JobDetail scheduledScanJobDetail) {
        // Runs daily at 02:00 UTC (PRD §4 & Module 8)
        return TriggerBuilder.newTrigger()
            .forJob(scheduledScanJobDetail)
            .withIdentity("scheduledScanTrigger", "security-scans")
            .withSchedule(CronScheduleBuilder.dailyAtHourAndMinute(2, 0)
                .withMisfireHandlingInstructionDoNothing())
            .build();
    }
}
