--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-17
-- Descripción: Procedimiento que busca si existe un usuario con un
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_Login]
    @IN_email           VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);

    BEGIN TRY

        SELECT  U.[id] AS 'UsuarioID',
                U.[clave],
                U.[correo],
                E.[id] AS 'EstudianteID',
                U.[idTipoUsuario],
                TU.[descripcion] AS 'TipoUsuario'
        FROM [dbo].[Usuarios] U
        INNER JOIN  [dbo].[TiposUsuario] TU
            ON U.[idTipoUsuario] = TU.[id]
        LEFT JOIN Estudiantes E
            ON U.[id] = E.[idUsuario]   
        WHERE U.[correo] = @IN_email
            AND (
                E.[eliminado] = 0
                OR E.[eliminado] IS NULL
            );

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;