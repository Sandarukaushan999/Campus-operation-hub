package com.campus.config;

import com.campus.common.enums.BookingStatus;
import com.campus.common.enums.NotificationType;
import com.campus.common.enums.ResourceStatus;
import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import com.campus.common.enums.TicketStatus;
import com.campus.common.enums.UserRole;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

// Custom Mongo converters.
//
// Historic data in the shared Atlas cluster contains role values with
// inconsistent casing (e.g. "admin" instead of "ADMIN"). The default
// String -> Enum converter calls Enum.valueOf() which is strictly
// case-sensitive, so a single bad row breaks login for everyone.
//
// The @ReadingConverter below runs ONLY when Spring Data reads a document
// from Mongo into a Java entity -- it does not participate in query mapping
// where an unrelated String (e.g. an email) would otherwise be run through
// UserRole.valueOf and blow up. Returning null for unrecognised values keeps
// us from crashing on yet more unexpected casing rather than silently
// producing the wrong enum.
@Configuration
public class MongoConversionsConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
            new StringToUserRoleReader(),
            new StringToTicketCategoryReader(),
            new StringToTicketPriorityReader(),
            new StringToTicketStatusReader(),
            new StringToBookingStatusReader(),
            new StringToResourceStatusReader(),
            new StringToNotificationTypeReader()
        ));
    }

    @ReadingConverter
    static class StringToUserRoleReader implements Converter<String, UserRole> {
        @Override
        public UserRole convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return UserRole.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToTicketCategoryReader implements Converter<String, TicketCategory> {
        @Override
        public TicketCategory convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return TicketCategory.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToTicketPriorityReader implements Converter<String, TicketPriority> {
        @Override
        public TicketPriority convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return TicketPriority.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToTicketStatusReader implements Converter<String, TicketStatus> {
        @Override
        public TicketStatus convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return TicketStatus.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToBookingStatusReader implements Converter<String, BookingStatus> {
        @Override
        public BookingStatus convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return BookingStatus.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToResourceStatusReader implements Converter<String, ResourceStatus> {
        @Override
        public ResourceStatus convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return ResourceStatus.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }

    @ReadingConverter
    static class StringToNotificationTypeReader implements Converter<String, NotificationType> {
        @Override
        public NotificationType convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return NotificationType.valueOf(source.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }
}
