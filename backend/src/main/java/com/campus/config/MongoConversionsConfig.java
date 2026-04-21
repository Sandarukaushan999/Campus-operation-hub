package com.campus.config;

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
        return new MongoCustomConversions(List.of(new StringToUserRoleReader()));
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
}
